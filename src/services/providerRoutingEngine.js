// src/services/providerRoutingEngine.js

const providerCapabilitiesEngine = require("./providerCapabilitiesEngine");
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
      const caps = await providerCapabilitiesEngine.getProviderCapabilities(provider, fax);

      if (caps.health === "down" || caps.outageState === "open") {
        continue;
      }

      scored.push({
        provider,
        weight: caps.weight,
        latency: caps.latency,
        health: caps.health,
        score: caps.score,
        outageState: caps.outageState,
      });
    }

    if (!scored.length) {
      throw new Error("No available providers after diagnostics filtering");
    }

    scored.sort((a, b) => b.weight - a.weight);

    return scored[0].provider;
  },

  async getProviderWeight(provider) {
    const caps = await providerCapabilitiesEngine.getProviderCapabilities(provider);
    return caps.weight;
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

    return providerCapabilitiesEngine.getProviderCapabilities(provider);
  }
};
