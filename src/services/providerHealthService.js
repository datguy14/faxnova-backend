// providerHealthService.js

const providerOutageService = require("./providerOutageService");
const providerLatencyTracker = require("./providerLatencyTracker");

// In-memory health map (Redis optional)
const providerHealth = {
  sinch: "healthy",
  telnyx: "healthy",
};

module.exports = {
  // ---------------------------------------------------------
  // Get provider health
  // ---------------------------------------------------------
  getHealth(provider) {
    return providerHealth[provider] || "unknown";
  },

  // ---------------------------------------------------------
  // Set provider health manually or programmatically
  // ---------------------------------------------------------
  setHealth(provider, status) {
    providerHealth[provider] = status;
    return providerHealth[provider];
  },

  // ---------------------------------------------------------
  // Mark provider as degraded (soft failure)
  // ---------------------------------------------------------
  degrade(provider, reason = "unknown") {
    providerHealth[provider] = "degraded";

    return {
      provider,
      status: "degraded",
      reason,
    };
  },

  // ---------------------------------------------------------
  // Mark provider as down (hard failure)
  // ---------------------------------------------------------
  down(provider, reason = "unknown") {
    providerHealth[provider] = "down";

    return {
      provider,
      status: "down",
      reason,
    };
  },

  // ---------------------------------------------------------
  // Auto-update health based on outage detection
  // ---------------------------------------------------------
  async evaluateOutage(provider) {
    const isOutage = await providerOutageService.isOutage(provider);

    if (isOutage) {
      providerHealth[provider] = "down";
    } else {
      providerHealth[provider] = "healthy";
    }

    return providerHealth[provider];
  },

  // ---------------------------------------------------------
  // Auto-update health based on latency spikes
  // ---------------------------------------------------------
  async evaluateLatency(provider) {
    const latency = await providerLatencyTracker.getLatency(provider);

    if (latency > 5000) {
      providerHealth[provider] = "degraded";
    }

    if (latency > 15000) {
      providerHealth[provider] = "down";
    }

    return providerHealth[provider];
  },

  // ---------------------------------------------------------
  // Unified health evaluator (called by webhookController)
  // ---------------------------------------------------------
  async evaluate(provider) {
    // Outage check
    await this.evaluateOutage(provider);

    // Latency check
    await this.evaluateLatency(provider);

    return providerHealth[provider];
  },
};
