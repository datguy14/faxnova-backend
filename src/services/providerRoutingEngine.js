// src/services/providerRoutingEngine.js

const providerHealthService = require("./providerHealthService");
const providerPerformanceService = require("./providerPerformanceService");
const providerLatencyTracker = require("./providerLatencyTracker");
const providerOutageService = require("./providerOutageService");
const providerDiagnosticsService = require("./providerDiagnosticsService");

// FaxNova providers
const PROVIDERS = ["sinch", "telnyx"];

module.exports = {
  // ---------------------------------------------------------
  // Select best provider using sovereignty routing
  // ---------------------------------------------------------
  async selectProvider() {
    const scored = [];

    for (const provider of PROVIDERS) {
      const health = providerHealthService.getHealth(provider);
      const score = providerPerformanceService.getScore(provider);
      const latency = await providerLatencyTracker.getLatency(provider);
      const outage = await providerOutageService.isOutage(provider);

      // Hard fail: provider is down or outage detected
      if (health === "down" || outage) {
        continue;
      }

      // Soft fail: degraded providers get reduced weight
      const healthWeight = health === "degraded" ? 0.5 : 1;

      // Latency penalty (higher latency → lower weight)
      const latencyPenalty = latency > 5000 ? 0.7 : 1;

      const weight = score * healthWeight * latencyPenalty;

      scored.push({ provider, weight });
    }

    if (scored.length === 0) {
      throw new Error("No available providers");
    }

    // Sort by highest weight
    scored.sort((a, b) => b.weight - a.weight);

    return scored[0].provider;
  },

  // ---------------------------------------------------------
  // Return provider weight (for diagnostics)
  // ---------------------------------------------------------
  async getProviderWeight(provider) {
    const health = providerHealthService.getHealth(provider);
    const score = providerPerformanceService.getScore(provider);
    const latency = await providerLatencyTracker.getLatency(provider);
    const outage = await providerOutageService.isOutage(provider);

    if (health === "down" || outage) return 0;

    const healthWeight = health === "degraded" ? 0.5 : 1;
    const latencyPenalty = latency > 5000 ? 0.7 : 1;

    return score * healthWeight * latencyPenalty;
  },

  // ---------------------------------------------------------
  // Record provider event (from webhookController)
  // ---------------------------------------------------------
  async recordEvent(provider, event) {
    // Update health + score based on event
    if (event.status === "delivered") {
      providerPerformanceService.applySuccessBoost(provider);
      providerHealthService.setHealth(provider, "healthy");
    }

    if (event.status === "failed") {
      providerPerformanceService.applyFailurePenalty(provider);
      providerHealthService.setHealth(provider, "degraded");
    }

    // Optionally: log diagnostics
    const diag = await providerDiagnosticsService.getDiagnostics(provider);
    console.log("Provider diagnostics:", diag);

    return diag;
  },
};
