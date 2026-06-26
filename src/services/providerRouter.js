// src/services/providerRouter.js

const providerOutageService = require("./providerOutageService");
const providerPerformanceService = require("./providerPerformanceService");
const providerRoutingRules = require("./providerRoutingRules");

const FaxNovaError = require("../errors/FaxNovaError");

module.exports = {
  /**
   * Returns all providers with metadata
   */
  getProviders() {
    return providerRoutingRules.getAllProviders();
  },

  /**
   * Returns provider health + performance summary
   */
  async getProviderStatus() {
    const outages = await providerOutageService.getActiveOutages();
    const performance = await providerPerformanceService.getPerformanceSummary();
    const routing = providerRoutingRules.getAllProviders();

    return { outages, performance, routing };
  },

  /**
   * Core routing engine:
   * - Removes providers in outage
   * - Applies residency rules
   * - Applies tier rules
   * - Applies provider weights
   * - Scores providers by performance
   * - Selects best provider
   */
  async selectBestProvider({ country, tier }) {
    const allProviders = providerRoutingRules.getAllProviders();
    const outages = await providerOutageService.getActiveOutages();
    const performance = await providerPerformanceService.getPerformanceSummary();

    // 1. Remove providers in outage
    const available = allProviders.filter(
      (p) => !outages.some((o) => o.provider === p.name)
    );

    if (available.length === 0) {
      throw new FaxNovaError("No providers available (all in outage)", {
        code: "NO_PROVIDERS_AVAILABLE",
        details: { outages }
      });
    }

    // 2. Apply residency rules
    const residencyFiltered = available.filter((p) =>
      providerRoutingRules.isAllowedForCountry(p.name, country)
    );

    if (residencyFiltered.length === 0) {
      throw new FaxNovaError("No providers allowed for this region", {
        code: "RESIDENCY_BLOCK",
        details: { country }
      });
    }

    // 3. Apply tier rules
    const tierFiltered = residencyFiltered.filter((p) =>
      providerRoutingRules.isAllowedForTier(p.name, tier)
    );

    if (tierFiltered.length === 0) {
      throw new FaxNovaError("No providers allowed for this tier", {
        code: "TIER_BLOCK",
        details: { tier }
      });
    }

    // 4. Score providers
    const scored = tierFiltered.map((provider) => {
      const perf = performance[provider.name] || {
        successRate: 0.9,
        latency: 1000
      };

      const score =
        provider.weight * 0.4 +
        perf.successRate * 0.4 +
        (1 / Math.max(perf.latency, 1)) * 0.2;

      return {
        provider: provider.name,
        score,
        weight: provider.weight,
        performance: perf
      };
    });

    // 5. Select highest score
    scored.sort((a, b) => b.score - a.score);

    return scored[0];
  }
};
