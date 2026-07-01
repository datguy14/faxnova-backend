// src/workers/webhookWorker.js

const { webhookSchema } = require("../schemas/webhookSchemas");
const OutboundFax = require("../models/OutboundFax");

const providerPerformanceService = require("../services/providerPerformanceService");
const providerHealthService = require("../services/providerHealthService");
const providerOutageService = require("../services/providerOutageService");
const providerLatencyTracker = require("../services/providerLatencyTracker");

const FaxNovaError = require("../errors/FaxNovaError");

module.exports = async function processWebhook(event) {
  try {
    // Validate payload
    const data = webhookSchema.parse(event);

    const {
      faxId,
      provider,
      status,
      providerStatus,
      latencyMs,
      errorCode,
      errorMessage,
      timestamp
    } = data;

    // Update fax (UUID or ObjectId depending on architecture)
    const fax = await OutboundFax.findOneAndUpdate(
      { faxUuid: faxId },
      {
        status,
        providerStatus,
        errorCode,
        errorMessage,
        lastWebhookAt: timestamp || Date.now()
      },
      { new: true }
    );

    if (!fax) {
      throw new FaxNovaError("Fax not found for webhook", 404);
    }

    // Provider performance
    if (status === "completed") {
      providerPerformanceService.applySuccessBoost(provider);
    } else {
      providerPerformanceService.applyFailurePenalty(provider);
    }

    // Latency tracking
    if (latencyMs) {
      providerLatencyTracker.recordLatency(provider, latencyMs);
    }

    // Outage engine
    if (status === "failed") {
      await providerOutageService.recordFailure(provider);
    } else {
      await providerOutageService.recordSuccess(provider);
    }

    // Health evaluation
    await providerHealthService.evaluate(provider);

    return { ok: true };

  } catch (err) {
    console.error("Webhook worker error:", err);
    throw err;
  }
};
