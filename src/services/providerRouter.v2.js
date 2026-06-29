// src/services/providerRouter.v2.js

const sinchAdapter = require("../providers/sinchAdapter");
const telnyxAdapter = require("../providers/telnyxAdapter");

const providerOutageService = require("./providerOutageService");
const providerPerformanceService = require("./providerPerformanceService");

class ProviderRouter {
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

  // Provider scoring engine
  static async scoreProviders(region) {
    const providers = ["sinch", "telnyx"];

    const scores = {};

    for (const provider of providers) {
      const outagePenalty = await providerOutageService.getPenalty(provider);
      const performanceBoost = await providerPerformanceService.getBoost(provider);

      // Sovereignty weighting
      const regionWeight =
        region === "us" && provider === "sinch"
          ? 1.2
          : region === "eu" && provider === "telnyx"
          ? 1.2
          : 1.0;

      scores[provider] = regionWeight + performanceBoost - outagePenalty;
    }

    return scores;
  }

  // Select best provider
  static async selectBestProvider(region) {
    const scores = await this.scoreProviders(region);

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return sorted[0][0]; // provider name
  }

  // Failover provider
  static async failoverProvider(previousProvider, region) {
    const providers = ["sinch", "telnyx"];
    const fallback = providers.find((p) => p !== previousProvider);

    const outagePenalty = await providerOutageService.getPenalty(previousProvider);

    // If outage penalty is high → failover
    if (outagePenalty > 1.5) {
      return fallback;
    }

    // Otherwise choose best provider for region
    return this.selectBestProvider(region);
  }
}

module.exports = ProviderRouter;
