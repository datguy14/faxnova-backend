// src/services/providerRouter.v2.js — STRICT-MODE VERSION

const sinchAdapter = require("../providers/sinchAdapter");
const telnyxAdapter = require("../providers/telnyxAdapter");

const providerRoutingEngine = require("./providerRoutingEngine");
const providerOutageService = require("./providerOutageService");
const providerPerformanceService = require("./providerPerformanceService");

class ProviderRouter {
  /**
   * Return provider adapter
   */
  static getAdapter(provider) {
    switch (provider) {
      case "sinch":
        return sinchAdapter;
      case "telnyx":
        return telnyxAdapter;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Strict-mode provider scoring
   * Uses:
   * - outageState
   * - cooldownUntil
   * - probationUntil
   * - performanceScore
   * - latency penalties
   * - region weighting
   */
  static async scoreProviders(region) {
    const providers = ["sinch", "telnyx"];
    const scores = {};

    for (const provider of providers) {
      const outageInfo = await providerOutageService.getOutageState(provider);
      const performanceScore = await providerPerformanceService.getScore(provider);

      // Outage penalties
      let outagePenalty = 0;
      switch (outageInfo.outageState) {
        case "open":
          outagePenalty = 100; // hard exclusion
          break;
        case "half_open":
          outagePenalty = 40;
          break;
        case "probation":
          outagePenalty = 25;
          break;
        case "degraded":
          outagePenalty = 15;
          break;
        case "healthy":
        default:
          outagePenalty = 0;
      }

      // Region weighting
      const regionWeight =
        region === "us" && provider === "sinch"
          ? 1.2
          : region === "eu" && provider === "telnyx"
          ? 1.2
          : 1.0;

      // Strict-mode score
      scores[provider] =
        performanceScore * regionWeight - outagePenalty;
    }

    return scores;
  }

  /**
   * Strict-mode provider selection
   * Delegates to providerRoutingEngine for full scoring
   */
  static async selectBestProvider(region) {
    return providerRoutingEngine.selectProviderForFax({ region });
  }

  /**
   * Strict-mode failover logic
   * Uses outageState + cooldownUntil + probationUntil
   */
  static async failoverProvider(previousProvider, region) {
    const providers = ["sinch", "telnyx"];
    const fallback = providers.find((p) => p !== previousProvider);

    const outageInfo = await providerOutageService.getOutageState(previousProvider);

    // Hard failover if provider is OPEN or in cooldown
    if (
      outageInfo.outageState === "open" ||
      (outageInfo.cooldownUntil && outageInfo.cooldownUntil > Date.now())
    ) {
      return fallback;
    }

    // Otherwise choose best provider
    return this.selectBestProvider(region);
  }
}

module.exports = ProviderRouter;
