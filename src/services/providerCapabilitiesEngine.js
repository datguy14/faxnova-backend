// src/services/providerCapabilitiesService.js

const providerDiagnosticsService = require("./providerDiagnosticsService");
const providerHealthService = require("./providerHealthService");
const providerOutageService = require("./providerOutageService");
const providerPerformanceService = require("./providerPerformanceService");
const providerLatencyTracker = require("./providerLatencyTracker");

const PROVIDERS = ["sinch", "telnyx"];

module.exports = {
  async getAllowedProvidersForFax(fax) {
    const country = fax.toCountry || "US";

    return PROVIDERS.filter(provider => {
      const caps = providerDiagnosticsService.getStaticCapabilities(provider);

      if (!caps.residency[country]) return false;
      if (!caps.canSend) return false;

      return true;
    });
  },

  async getProviderCapabilities(provider, fax = null) {
    const health = await providerHealthService.getHealth(provider);
    const outageState = await providerOutageService.getOutageState(provider);
    const latency = await providerLatencyTracker.getLatency(provider);
    const score = await providerPerformanceService.getScore(provider);

    const staticCaps = providerDiagnosticsService.getStaticCapabilities(provider);

    const weight = this.calculateWeight({
      health,
      outageState,
      latency,
      score,
      staticCaps
    });

    return {
      provider,
      ...staticCaps,
      health,
      outageState,
      latency,
      score,
      weight
    };
  },

  calculateWeight({ health, outageState, latency, score, staticCaps }) {
    if (outageState === "open") return 0;
    if (health === "down") return 0;

    let weight = score;

    if (health === "degraded") weight *= 0.7;
    if (outageState === "half-open") weight *= 0.5;

    if (latency > 2000) weight *= 0.6;
    if (latency > 5000) weight *= 0.3;

    if (!staticCaps.canSend) weight = 0;

    return weight;
  }
};
