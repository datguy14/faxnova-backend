// src/services/providerRoutingEngine.js

const providerDiagnosticsService = require("./providerDiagnosticsService");
const providerResidencyEngine = require("./providerResidencyEngine");
const providerPerformanceService = require("./providerPerformanceService");
const providerHealthService = require("./providerHealthService");

module.exports = {
  async selectProviderForFax(fax) {
    const allowedProviders =
      providerResidencyEngine.getAllowedProvidersForFax(fax);

    if (!allowedProviders.length) {
      throw new Error("No providers satisfy residency constraints");
    }

    const scored = [];

    for (const provider of allowedProviders) {
      const diag = await providerDiagnosticsService.getDiagnostics(provider);

      if (diag.health === "down" || diag.outageState === "open") {
        continue;
      }

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
