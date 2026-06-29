// src/services/routingService.v2.js

const providerRouter = require("./providerRouter.v2");
const providerScoreCache = require("./providerScoreCache");
const providerLatencyTracker = require("./providerLatencyTracker");
const providerHealthService = require("./providerHealthService");
const providerOutageService = require("./providerOutageService");
const providerPerformanceService = require("./providerPerformanceService");
const providerFailoverService = require("./providerFailoverService");
const residencyEngine = require("./residencyEngine");

class RoutingEngineV2 {
  /**
   * Main provider selection logic
   */
  static async selectProvider({ region, to, tenantId }) {
    // Residency rules (sovereignty)
    const residencyRegion = await residencyEngine.resolveRegion({
      region,
      to,
      tenantId,
    });

    // Cached score?
    const cached = await providerScoreCache.getBestProvider(residencyRegion);
    if (cached) return cached;

    // Compute fresh scores
    const scores = await this.computeProviderScores(residencyRegion);

    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];

    // Cache result for 30 seconds
    await providerScoreCache.setBestProvider(residencyRegion, best);

    return best;
  }

  /**
   * Provider failover logic
   */
  static async failoverProvider({ previousProvider, region, to, tenantId }) {
    const residencyRegion = await residencyEngine.resolveRegion({
      region,
      to,
      tenantId,
    });

    const outagePenalty = await providerOutageService.getPenalty(previousProvider);

    // If provider is degraded → failover
    if (outagePenalty > 1.5) {
      return providerFailoverService.getFallback(previousProvider);
    }

    // Otherwise choose best provider
    return this.selectProvider({ region: residencyRegion, to, tenantId });
  }

  /**
   * Provider scoring engine
   */
  static async computeProviderScores(region) {
    const providers = ["sinch", "telnyx"];
    const scores = {};

    for (const provider of providers) {
      const outagePenalty = await providerOutageService.getPenalty(provider);
      const performanceBoost = await providerPerformanceService.getBoost(provider);
      const healthScore = await providerHealthService.getHealth(provider);
      const latencyScore = await providerLatencyTracker.getLatencyScore(provider);

      // Sovereignty weighting
      const regionWeight =
        region === "us" && provider === "sinch"
          ? 1.2
          : region === "eu" && provider === "telnyx"
          ? 1.2
          : 1.0;

      scores[provider] =
        regionWeight +
        performanceBoost +
        healthScore +
        latencyScore -
        outagePenalty;
    }

    return scores;
  }
}

module.exports = RoutingEngineV2;
