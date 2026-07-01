// src/services/providerRoutingEngine.js

const providerDiagnosticsService = require("./providerDiagnosticsService");
const providerResidencyEngine = require("./providerResidencyEngine");

module.exports = {
  async selectProviderForFax(fax) {
    // 1) Residency + sovereignty filtering
    const allowedProviders =
      providerResidencyEngine.getAllowedProvidersForFax(fax);

    if (!allowedProviders.length) {
      throw new Error("No providers satisfy residency constraints");
    }

    const scored = [];

    // 2) Unified diagnostics for each provider
    for (const provider of allowedProviders) {
      const diag = await providerDiagnosticsService.getDiagnostics(provider);

      // Hard fail: provider is down or outage detected
      if (diag.health === "down" || diag.outageState === "open") {
        continue;
      }

      // Unified routing weight
      scored.push({
        provider,
        weight: diag.routingWeight,
        latency: diag.latency,
        health: diag.health,
        score: diag.score,
        outageState: diag.outageState,
      });
    }

    if (!scored.length) {
      throw new Error("No available providers after diagnostics filtering");
    }

    // 3) Sort by unified weight
    scored.sort((a, b) => b.weight - a.weight);

    return scored[0].provider;
  },

  async getProviderWeight(provider) {
    const diag = await providerDiagnosticsService.getDiagnostics(provider);
    return diag.routingWeight;
  },

  async recordEvent(provider, event) {
    if (event.status === "delivered") {
      providerPerformanceService.applySuccessBoost(provider);
      providerHealthService.setHealth(provider, "healthy");
    }

    if (event.status === "failed") {
      providerPerformanceService.applyFailurePenalty(provider);
      providerHealthService.setHealth(provider, "degraded");
    }

    return providerDiagnosticsService.getDiagnostics(provider);
  }
};
