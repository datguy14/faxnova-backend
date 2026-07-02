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
      const ewma = await providerLatencyTracker.getLatency(provider);
      const { p95, p99 } = await providerLatencyTracker.getPercentiles(provider);

      // Hard exclusions
      if (outageState === "open") {
        scores.push({ provider, weight: 0 });
        continue;
      }

      let weight = score;

      // Health penalties
      if (health === "degraded") weight *= 0.7;
      if (health === "half-open") weight *= 0.4;

      // EWMA penalties
      if (ewma > 5000) weight *= 0.3;
      else if (ewma > 2000) weight *= 0.7;

      // Percentile penalties
      if (p99 > 6000) weight *= 0.2;
      else if (p95 > 4000) weight *= 0.5;

      scores.push({ provider, weight });
    }

    scores.sort((a, b) => b.weight - a.weight);

    const best = scores[0];
    if (!best || best.weight <= 0) {
      throw new Error("No available providers");
    }

    return best.provider;
  }
};
