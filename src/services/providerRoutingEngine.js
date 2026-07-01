// src/services/providerRoutingEngine.js

const providerCapabilitiesService = require("./providerCapabilitiesService");
const providerPerformanceService = require("./providerPerformanceService");
const providerHealthService = require("./providerHealthService");
const providerOutageService = require("./providerOutageService");
const providerLatencyTracker = require("./providerLatencyTracker");
const providerDiagnosticsService = require("./providerDiagnosticsService");

module.exports = {
  async selectProviderForFax(fax) {
    // Residency filtering now handled inside capabilities service
    const allowedProviders =
      await providerCapabilitiesService.getAllowedProvidersForFax(fax);

    if (!allowedProviders.length) {
      throw new Error("No providers satisfy residency/capability constraints");
    }

    const scored = [];

    for (const provider of allowedProviders) {
      const caps = await providerCapabilitiesService.getProviderCapabilities(provider, fax);

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
    const caps = await providerCapabilitiesService.getProviderCapabilities(provider);
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

    return providerCapabilitiesService.getProviderCapabilities(provider);
  }
};
