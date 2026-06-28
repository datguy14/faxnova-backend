// src/providers/providerRouter.js

const FaxNovaError = require("../errors/FaxNovaError");
const {
  selectBestProvider,
  scoreProvider,
  providers
} = require("./providerRoutingRules");

const providerPerformanceService = require("../services/providerPerformanceService");
const providerOutageService = require("../services/providerOutageService");

/**
 * Provider Router (FaxNova v1, Routing Engine v2)
 *
 * Responsibilities:
 * - Filter providers by residency + tier
 * - Apply outage rules
 * - Apply performance scoring
 * - Apply cost scoring
 * - Select best provider deterministically
 */

async function routeProvider({ residencyZone, tier }) {
  try {
    // ---------------------------------------------
    // 1. Get base provider candidate from rules
    // ---------------------------------------------
    const base = selectBestProvider({ residencyZone, tier });

    // ---------------------------------------------
    // 2. Outage filtering
    // ---------------------------------------------
    const outages = await providerOutageService.getActiveOutages();
    const outageProviders = outages.map((o) => o.provider);

    const availableProviders = Object.values(providers).filter(
      (p) => !outageProviders.includes(p.name)
    );

    if (!availableProviders.length) {
      throw new FaxNovaError("All providers are currently in outage", {
        code: "ALL_PROVIDERS_OUTAGE"
      });
    }

    // ---------------------------------------------
    // 3. Performance scoring
    // ---------------------------------------------
    const performanceScores = await providerPerformanceService.getScores();

    // ---------------------------------------------
    // 4. Build final scoring table
    // ---------------------------------------------
    const scored = availableProviders.map((provider) => {
      const baseScore = scoreProvider(provider, residencyZone, tier);

      const perfScore = performanceScores[provider.name] || 0;

      const finalScore = Math.round(baseScore + perfScore);

      return {
        provider: provider.name,
        score: finalScore
      };
    });

    // ---------------------------------------------
    // 5. Select highest scoring provider
    // ---------------------------------------------
    scored.sort((a, b) => b.score - a.score);

    return scored[0];
  } catch (err) {
    throw new FaxNovaError("Provider routing failed", {
      code: "PROVIDER_ROUTING_FAILED",
      details: err.message
    });
  }
}

module.exports = {
  routeProvider
};
