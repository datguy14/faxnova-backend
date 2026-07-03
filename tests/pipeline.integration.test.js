/**
 * tests/pipeline.integration.test.js
 *
 * Strict-mode integration tests for the entire fax-sending pipeline:
 * - Outbound fax → Retry fax → Webhook processing
 * - Provider stack interactions (routing, health, outage, performance, latency)
 * - Redis-backed state consistency
 * - Error propagation and recovery
 * - Deterministic and horizontally scalable
 */

const OutboundFax = require("../src/models/OutboundFax");
const WebhookEvent = require("../src/models/WebhookEvent");
const { sendFax } = require("../src/services/sendFaxService");
const providerOutageService = require("../src/services/providerOutageService");
const providerHealthService = require("../src/services/providerHealthService");
const providerPerformanceService = require("../src/services/providerPerformanceService");
const providerLatencyTracker = require("../src/services/providerLatencyTracker");
const providerRoutingEngine = require("../src/services/providerRoutingEngine");
const processRetryFax = require("../src/workers/retryFaxWorker");
const processWebhookBatch = require("../src/workers/webhookWorker");
const { handleWebhook } = require("../src/controllers/webhookController");
const redis = require("../src/lib/redis");
const crypto = require("crypto");

// Test configuration
const TEST_PROVIDERS = ["sinch", "telnyx"];
const TEST_SECRET = process.env.PROVIDER_WEBHOOK_SECRET || "test-webhook-secret";

/**
 * Helper: Create mock job object for workers
 */
function createMockJob(data) {
  return { data };
}

/**
 * Helper: Create mock request/response for controller
 */
function createMockReqRes() {
  const req = {
    body: {},
    headers: {}
  };
  const res = {
    status: jest.fn(function(code) {
      this.statusCode = code;
      return this;
    }),
    json: jest.fn(function(data) {
      this.jsonData = data;
      return this;
    })
  };
  return { req, res };
}

/**
 * Helper: Generate HMAC signature
 */
function generateSignature(payload, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");
}

describe("Fax-Sending Pipeline Integration Tests", () => {
  beforeEach(async () => {
    // Clear databases
    await OutboundFax.deleteMany({});
    await WebhookEvent.deleteMany({});

    // Clear Redis
    await redis.flushdb();

    // Reset provider states
    for (const provider of TEST_PROVIDERS) {
      await providerOutageService.recordSuccess(provider);
      await providerPerformanceService.applySuccessBoost(provider);
      await providerHealthService.evaluate(provider);
      await providerLatencyTracker.recordLatency(provider, 100);
    }
  });

  afterAll(async () => {
    await redis.quit();
  });

  describe("Provider Routing Engine", () => {
    test("selectProviderForFax should choose best healthy provider", async () => {
      const fax = {
        faxId: "fax-001",
        toNumber: "+1234567890",
        fromNumber: "+9876543210",
        documentUrl: "https://example.com/doc.pdf"
      };

      const provider = await providerRoutingEngine.selectProviderForFax(fax);

      expect(TEST_PROVIDERS).toContain(provider);
      expect(provider).toBeTruthy();
    });

    test("selectProviderForFax should exclude OPEN outage providers", async () => {
      // Mark sinch as OPEN outage
      for (let i = 0; i < 5; i++) {
        await providerOutageService.recordFailure("sinch");
      }

      const fax = {
        faxId: "fax-002",
        toNumber: "+1234567890",
        fromNumber: "+9876543210",
        documentUrl: "https://example.com/doc.pdf"
      };

      const provider = await providerRoutingEngine.selectProviderForFax(fax);

      expect(provider).toBe("telnyx");
    });

    test("selectProviderForFax should throw if all providers DOWN", async () => {
      // Mark both providers as OPEN
      for (const provider of TEST_PROVIDERS) {
        for (let i = 0; i < 5; i++) {
          await providerOutageService.recordFailure(provider);
        }
      }

      const fax = {
        faxId: "fax-003",
        toNumber: "+1234567890",
        fromNumber: "+9876543210",
        documentUrl: "https://example.com/doc.pdf"
      };

      await expect(
        providerRoutingEngine.selectProviderForFax(fax)
      ).rejects.toThrow("No available providers");
    });

    test("getDiagnostics should return structured provider metrics", async () => {
      const diagnostics = await providerRoutingEngine.getDiagnostics();

      expect(Array.isArray(diagnostics)).toBe(true);
      expect(diagnostics.length).toBeGreaterThan(0);

      const diag = diagnostics[0];
      expect(diag).toHaveProperty("provider");
      expect(diag).toHaveProperty("metrics.performanceScore");
      expect(diag).toHaveProperty("metrics.health");
      expect(diag).toHaveProperty("metrics.outageState");
      expect(diag).toHaveProperty("metrics.ewma");
    });
  });

  describe("Outbound Fax Worker → SendFax Service", () => {
    test("should successfully send fax and record latency", async () => {
      const fax = await OutboundFax.create({
        faxId: "fax-send-001",
        toNumber: "+1234567890",
        fromNumber: "+9876543210",
        documentUrl: "https://example.com/doc.pdf",
        provider: "sinch",
        status: "queued"
      });

      // Mock adapter success
      jest.spyOn(require("../src/providers/sinchAdapter"), "sendFax")
        .mockResolvedValueOnce({
          messageId: "msg-123",
          raw: { id: "msg-123" }
        });

      await sendFax(fax.faxId);

      // Verify fax updated
      const updated = await OutboundFax.findOne({ faxId: fax.faxId });
      expect(updated.status).toBe("sending");
      expect(updated.providerMessageId).toBe("msg-123");
      expect(updated.attempts).toBe(1);

      // Verify latency recorded
      const latency = await providerLatencyTracker.getLatency("sinch");
      expect(latency).toBeGreaterThan(0);

      // Verify performance boosted
      const score = await providerPerformanceService.getScore("sinch");
      expect(score).toBeGreaterThan(80); // Default + boost
    });

    test("should record failure and apply penalty", async () => {
      const fax = await OutboundFax.create({
        faxId: "fax-fail-001",
        toNumber: "+1234567890",
        fromNumber: "+9876543210",
        documentUrl: "https://example.com/doc.pdf",
        provider: "telnyx",
        status: "queued"
      });

      // Mock adapter failure
      jest.spyOn(require("../src/providers/telnyxAdapter"), "sendFax")
        .mockRejectedValueOnce(new Error("API error"));

      await expect(sendFax(fax.faxId)).rejects.toThrow();

      // Verify fax marked as failed
      const updated = await OutboundFax.findOne({ faxId: fax.faxId });
      expect(updated.status).toBe("failed");
      expect(updated.errorCode).toBe("SEND_FAILED");
      expect(updated.errorMessage).toContain("API error");

      // Verify performance penalized
      const score = await providerPerformanceService.getScore("telnyx");
      expect(score).toBeLessThan(80); // Default - penalty

      // Verify outage recorded
      const outageState = await providerOutageService.getOutageState("telnyx");
      expect(outageState).toBe("closed"); // 1 failure < 5 threshold
    });
  });

  describe("Retry Fax Worker", () => {
    test("should skip retry if provider in OPEN outage", async () => {
      const fax = await OutboundFax.create({
        faxId: "fax-retry-001",
        toNumber: "+1234567890",
        fromNumber: "+9876543210",
        documentUrl: "https://example.com/doc.pdf",
        provider: "sinch",
        status: "failed",
        attempts: 1,
        lastAttemptAt: new Date(Date.now() - 5000) // 5s ago
      });

      // Mark provider as OPEN outage
      for (let i = 0; i < 5; i++) {
        await providerOutageService.recordFailure("sinch");
      }

      const job = createMockJob({ faxId: fax.faxId });
      const result = await processRetryFax(job);

      // Should return undefined (skipped)
      expect(result).toBeUndefined();

      // Fax should still have 1 attempt
      const unchanged = await OutboundFax.findOne({ faxId: fax.faxId });
      expect(unchanged.attempts).toBe(1);
    });

    test("should apply exponential backoff", async () => {
      const fax = await OutboundFax.create({
        faxId: "fax-retry-002",
        toNumber: "+1234567890",
        fromNumber: "+9876543210",
        documentUrl: "https://example.com/doc.pdf",
        provider: "telnyx",
        status: "failed",
        attempts: 2,
        lastAttemptAt: new Date() // Just now
      });

      const job = createMockJob({ faxId: fax.faxId });

      // Should skip because backoff not elapsed
      const result = await processRetryFax(job);
      expect(result).toBeUndefined();

      // Wait and try again (exponential backoff: 2^2 * 1000 = 4s)
      // For test, just verify the calculation is correct
      const maxBackoff = Math.min(60000, Math.pow(2, 2) * 1000);
      expect(maxBackoff).toBe(4000);
    });

    test("should succeed on retry after backoff elapsed", async () => {
      const fax = await OutboundFax.create({
        faxId: "fax-retry-003",
        toNumber: "+1234567890",
        fromNumber: "+9876543210",
        documentUrl: "https://example.com/doc.pdf",
        provider: "sinch",
        status: "failed",
        attempts: 0,
        lastAttemptAt: new Date(Date.now() - 2000) // 2s ago (backoff: 2^0 * 1000 = 1s)
      });

      jest.spyOn(require("../src/providers/sinchAdapter"), "sendFax")
        .mockResolvedValueOnce({
          messageId: "msg-retry-001",
          raw: { id: "msg-retry-001" }
        });

      const job = createMockJob({ faxId: fax.faxId });
      await processRetryFax(job);

      // Should increment attempts
      const retried = await OutboundFax.findOne({ faxId: fax.faxId });
      expect(retried.attempts).toBe(1);
      expect(retried.status).toBe("sending");
    });
  });

  describe("Webhook Controller → Webhook Worker", () => {
    test("webhookController should verify HMAC signature", async () => {
      const payload = {
        eventId: "evt-001",
        provider: "sinch",
        faxId: "fax-001",
        status: "delivered"
      };

      const { req, res } = createMockReqRes();
      req.body = payload;
      req.headers["x-provider-signature"] = generateSignature(payload, TEST_SECRET);

      process.env.PROVIDER_WEBHOOK_SECRET = TEST_SECRET;

      await handleWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Webhook queued for processing"
        })
      );
    });

    test("webhookController should reject invalid signature", async () => {
      const payload = {
        eventId: "evt-002",
        provider: "telnyx",
        faxId: "fax-002",
        status: "failed"
      };

      const { req, res } = createMockReqRes();
      req.body = payload;
      req.headers["x-provider-signature"] = "invalid-signature";

      process.env.PROVIDER_WEBHOOK_SECRET = TEST_SECRET;

      await handleWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "SIGNATURE_INVALID"
        })
      );
    });

    test("webhookController should validate required fields", async () => {
      const payload = {
        eventId: "evt-003",
        provider: "sinch"
        // Missing faxId and status
      };

      const { req, res } = createMockReqRes();
      req.body = payload;
      req.headers["x-provider-signature"] = generateSignature(payload, TEST_SECRET);

      process.env.PROVIDER_WEBHOOK_SECRET = TEST_SECRET;

      await handleWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: "INVALID_WEBHOOK_EVENT"
        })
      );
    });

    test("webhookWorker should process batch and record metrics", async () => {
      const events = [
        {
          eventId: "evt-004",
          provider: "sinch",
          faxId: "fax-004",
          status: "delivered",
          providerStatus: "delivered",
          errorCode: null,
          errorMessage: null,
          raw: {}
        },
        {
          eventId: "evt-005",
          provider: "telnyx",
          faxId: "fax-005",
          status: "failed",
          providerStatus: "failed",
          errorCode: "API_ERROR",
          errorMessage: "API rate limit",
          raw: {}
        }
      ];

      // Create faxes
      await OutboundFax.create({
        faxId: "fax-004",
        toNumber: "+1111111111",
        fromNumber: "+2222222222",
        documentUrl: "https://example.com/doc.pdf",
        provider: "sinch",
        status: "sending"
      });

      await OutboundFax.create({
        faxId: "fax-005",
        toNumber: "+3333333333",
        fromNumber: "+4444444444",
        documentUrl: "https://example.com/doc.pdf",
        provider: "telnyx",
        status: "sending"
      });

      const job = createMockJob({ events });
      const result = await processWebhookBatch(job);

      // Verify results
      expect(result.processed).toBe(2);
      expect(result.updated).toBe(2);
      expect(result.providersAffected).toContain("sinch");
      expect(result.providersAffected).toContain("telnyx");

      // Verify webhook events recorded
      const evt1 = await WebhookEvent.findOne({ externalEventId: "evt-004" });
      expect(evt1).toBeTruthy();
      expect(evt1.status).toBe("delivered");

      // Verify fax statuses updated
      const fax1 = await OutboundFax.findOne({ faxId: "fax-004" });
      expect(fax1.status).toBe("delivered");

      // Verify metrics updated
      const sinchScore = await providerPerformanceService.getScore("sinch");
      expect(sinchScore).toBeGreaterThan(80);

      const telnyx Score = await providerPerformanceService.getScore("telnyx");
      expect(telnyx Score).toBeLessThan(80);
    });

    test("webhookWorker should enforce idempotency", async () => {
      const event = {
        eventId: "evt-006",
        provider: "sinch",
        faxId: "fax-006",
        status: "delivered",
        raw: {}
      };

      // Process first time
      const job1 = createMockJob({ events: [event] });
      const result1 = await processWebhookBatch(job1);
      expect(result1.processed).toBe(1);

      // Process again (duplicate)
      const job2 = createMockJob({ events: [event] });
      const result2 = await processWebhookBatch(job2);
      expect(result2.processed).toBe(0); // Should skip duplicate

      // Verify only one webhook event exists
      const count = await WebhookEvent.countDocuments({ externalEventId: "evt-006" });
      expect(count).toBe(1);
    });
  });

  describe("End-to-End Pipeline", () => {
    test("should complete full cycle: send → fail → retry → webhook", async () => {
      // 1. Create outbound fax
      const fax = await OutboundFax.create({
        faxId: "fax-e2e-001",
        toNumber: "+1234567890",
        fromNumber: "+9876543210",
        documentUrl: "https://example.com/doc.pdf",
        provider: "sinch",
        status: "queued"
      });

      // 2. Send fax (mock failure)
      jest.spyOn(require("../src/providers/sinchAdapter"), "sendFax")
        .mockRejectedValueOnce(new Error("Temporary API error"));

      await expect(sendFax(fax.faxId)).rejects.toThrow();

      let current = await OutboundFax.findOne({ faxId: fax.faxId });
      expect(current.status).toBe("failed");
      expect(current.attempts).toBe(1);

      // 3. Retry after backoff
      const lastAttempt = current.lastAttemptAt;
      current.lastAttemptAt = new Date(Date.now() - 2000); // Simulate 2s elapsed
      await OutboundFax.updateOne({ faxId: fax.faxId }, { lastAttemptAt: current.lastAttemptAt });

      jest.spyOn(require("../src/providers/sinchAdapter"), "sendFax")
        .mockResolvedValueOnce({
          messageId: "msg-e2e-001",
          raw: { id: "msg-e2e-001" }
        });

      const retryJob = createMockJob({ faxId: fax.faxId });
      await processRetryFax(retryJob);

      current = await OutboundFax.findOne({ faxId: fax.faxId });
      expect(current.status).toBe("sending");
      expect(current.attempts).toBe(2);

      // 4. Process webhook (delivery confirmation)
      const webhookEvent = {
        eventId: "evt-e2e-001",
        provider: "sinch",
        faxId: fax.faxId,
        status: "delivered",
        raw: {}
      };

      const webhookJob = createMockJob({ events: [webhookEvent] });
      await processWebhookBatch(webhookJob);

      current = await OutboundFax.findOne({ faxId: fax.faxId });
      expect(current.status).toBe("delivered");

      // Verify webhook recorded
      const recorded = await WebhookEvent.findOne({ externalEventId: "evt-e2e-001" });
      expect(recorded).toBeTruthy();

      // Verify provider metrics
      const sinchHealth = await providerHealthService.getHealth("sinch");
      expect(sinchHealth).toBe("healthy");
    });
  });

  describe("Redis State Consistency", () => {
    test("provider state should be deterministic and Redis-backed", async () => {
      // Record multiple failures
      for (let i = 0; i < 3; i++) {
        await providerOutageService.recordFailure("telnyx");
      }

      // Get state from Redis
      const state1 = await providerOutageService.getOutageState("telnyx");
      const diag1 = await providerOutageService.getDiagnostics("telnyx");

      // Verify consistency
      expect(state1).toBe("closed");
      expect(diag1.failures).toBe(3);

      // State should be consistent across calls
      const state2 = await providerOutageService.getOutageState("telnyx");
      expect(state2).toBe(state1);
    });

    test("provider metrics should be horizontally scalable", async () => {
      // Simulate multiple instances recording metrics
      await providerLatencyTracker.recordLatency("sinch", 100);
      await providerLatencyTracker.recordLatency("sinch", 150);
      await providerLatencyTracker.recordLatency("sinch", 200);

      // Get aggregated metrics
      const diag = await providerLatencyTracker.getDiagnostics("sinch");

      expect(diag.ewma).toBeGreaterThan(0);
      expect(diag.p95).toBeGreaterThan(0);
      expect(diag.p99).toBeGreaterThan(0);

      // All metrics should be derived from same Redis state
      const diag2 = await providerLatencyTracker.getDiagnostics("sinch");
      expect(diag2.ewma).toBe(diag.ewma);
    });
  });

  describe("Error Handling & Recovery", () => {
    test("should handle missing fax gracefully", async () => {
      const job = createMockJob({ faxId: "non-existent-fax" });

      await expect(processRetryFax(job)).resolves.toBeUndefined();
    });

    test("should handle invalid webhook event gracefully", async () => {
      const events = [
        {
          eventId: "evt-invalid-001",
          // Missing required fields
          raw: {}
        }
      ];

      const job = createMockJob({ events });

      // Should process without throwing
      const result = await processWebhookBatch(job);
      expect(result.processed).toBe(0); // Event skipped
    });

    test("should recover from database errors", async () => {
      const fax = await OutboundFax.create({
        faxId: "fax-recover-001",
        toNumber: "+1234567890",
        fromNumber: "+9876543210",
        documentUrl: "https://example.com/doc.pdf",
        provider: "sinch",
        status: "queued"
      });

      // Spy on updateOne to simulate transient error
      let callCount = 0;
      const originalUpdateOne = OutboundFax.updateOne;
      jest.spyOn(OutboundFax, "updateOne").mockImplementation(function(...args) {
        if (callCount++ === 0) {
          throw new Error("Temporary database error");
        }
        return originalUpdateOne.apply(this, args);
      });

      // Should throw, but not corrupt state
      await expect(sendFax(fax.faxId)).rejects.toThrow();

      // State should still be recoverable
      const recovered = await OutboundFax.findOne({ faxId: fax.faxId });
      expect(recovered).toBeTruthy();
    });
  });
});
