// src/services/sendFaxService.js

const routingService = require("./routingService.v2");
const providerPerformance = require("./providerPerformanceService");
const providerOutage = require("./providerOutageService");

const sinchAdapter = require("../providers/sinchAdapter");
const telnyxAdapter = require("../providers/telnyxAdapter");

const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../utils/auditLogger");

const PROVIDER_MAP = {
  sinch: sinchAdapter,
  telnyx: telnyxAdapter
};

async function sendThroughProvider(provider, payload) {
  const adapter = PROVIDER_MAP[provider];

  if (!adapter) {
    throw new FaxNovaError("Unknown provider adapter", {
      code: "UNKNOWN_PROVIDER",
      provider
    });
  }

  const start = Date.now();

  try {
    const result = await adapter.sendFax(payload);

    const latency = Date.now() - start;
    await providerPerformance.recordLatency(provider, latency);
    await providerPerformance.recordSuccess(provider);

    audit.log("fax_provider_success", {
      provider,
      latencyMs: latency
    });

    return {
      jobId: result.jobId,
      latencyMs: latency
    };
  } catch (err) {
    const latency = Date.now() - start;
    await providerPerformance.recordLatency(provider, latency);
    await providerPerformance.recordFailure(provider);
    await providerOutage.recordFailure(provider);

    audit.error("fax_provider_failure", {
      provider,
      latencyMs: latency,
      error: err.message
    });

    throw new FaxNovaError("Provider failed to send fax", {
      code: "PROVIDER_SEND_FAILURE",
      provider,
      details: err.message
    });
  }
}

module.exports = {
  /**
   * Main outbound fax pipeline.
   *
   * Steps:
   * 1. Routing Engine v2 selects primary + failover
   * 2. Attempt primary provider
   * 3. On failure → attempt failover provider
   * 4. Return final result
   */
  async sendFax({ residencyZone, tier, to, from, pages, documentUrl }) {
    try {
      // -----------------------------
      // 1. Routing Engine v2
      // -----------------------------
      const routing = await routingService.selectProvider({
        residencyZone,
        tier
      });

      const primary = routing.primary.provider;
      const failover = routing.failover?.provider || null;

      audit.log("fax_routing_decision", {
        residencyZone,
        tier,
        primary,
        failover,
        scored: routing.scored
      });

      const payload = { to, from, pages, documentUrl };

      // -----------------------------
      // 2. Try primary provider
      // -----------------------------
      try {
        const result = await sendThroughProvider(primary, payload);

        return {
          provider: primary,
          failoverProvider: null,
          jobId: result.jobId,
          latencyMs: result.latencyMs,
          routingScore: routing.primary.score
        };
      } catch (primaryErr) {
        if (!failover) throw primaryErr;

        audit.error("fax_primary_failed_attempting_failover", {
          primary,
          failover,
          error: primaryErr.message
        });
      }

      // -----------------------------
      // 3. Try failover provider
      // -----------------------------
      try {
        const result = await sendThroughProvider(failover, payload);

        return {
          provider: primary,
          failoverProvider: failover,
          jobId: result.jobId,
          latencyMs: result.latencyMs,
          routingScore: routing.failover.score
        };
      } catch (failoverErr) {
        audit.error("fax_failover_failed", {
          primary,
          failover,
          error: failoverErr.message
        });

        throw new FaxNovaError("Both primary and failover providers failed", {
          code: "ALL_PROVIDERS_FAILED",
          primary,
          failover,
          details: failoverErr.message
        });
      }
    } catch (err) {
      throw new FaxNovaError("Failed to send fax", {
        code: "SEND_FAX_ERROR",
        details: err.message
      });
    }
  }
};
