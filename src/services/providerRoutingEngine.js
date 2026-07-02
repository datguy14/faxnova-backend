// src/services/providerRoutingEngine.js

const providerHealthService = require("./providerHealthService");
const providerOutageService = require("./providerOutageService");
const providerPerformanceService = require("./providerPerformanceService");
const providerLatencyTracker = require("./providerLatencyTracker");

const PROVIDERS = ["sinch", "telnyx"];

module.exports = {
  async selectProviderForFax(fax) {
    const scores = [];

    for (const provider of PROVIDERS) {
      const outageState = await providerOutageService.getOutageState(provider);
      const health = await providerHealthService.getHealth(provider);
      const score = await providerPerformanceService.getScore(provider);
      const latency = await providerLatencyTracker.getLatency(provider);

      // Hard exclusions
      if (outageState === "open") {
        scores.push({ provider, weight: 0 });
        continue;
      }

      // Base weight from performance score
      let weight = score;

      // Health penalties
      if (health === "degraded") weight *= 0.6;
      if (health === "half-open") weight *= 0.4;

      // Latency penalties
      if (latency > 5000) weight *= 0.3;
      else if (latency > 2000) weight *= 0.7;

      scores.push({ provider, weight });
    }

    // Sort by weight descending
    scores.sort((a, b) => b.weight - a.weight);

    const best = scores[0];

    if (!best || best.weight <= 0) {
      throw new Error("No available providers");
    }

    return best.provider;
  }
};
