// src/services/providerRoutingRules.js

/**
 * Provider Routing Rules
 * Determines which providers are eligible for outbound fax routing
 * based on residency zone, sovereignty constraints, outages, and performance.
 */

const providerOutageService = require("./providerOutageService");
const providerPerformanceService = require("./providerPerformanceService");

const PROVIDERS = [
  {
    name: "twilio",
    regions: ["us", "ca"],
    priority: 1
  },
  {
    name: "plivo",
    regions: ["us", "eu"],
    priority: 2
  },
  {
    name: "telnyx",
    regions: ["us", "eu", "ca"],
    priority: 3
  }
];

module.exports = {
  /**
   * Returns all providers with metadata
   */
  getAllProviders() {
    return PROVIDERS;
  },

  /**
   * Returns providers allowed for a residency zone
   */
  getProvidersForZone(zone) {
    return PROVIDERS.filter((p) => p.regions.includes(zone));
  },

  /**
   * Returns providers sorted by priority
   */
  getProvidersByPriority(zone) {
    return this.getProvidersForZone(zone).sort(
      (a, b) => a.priority - b.priority
    );
  },

  /**
   * Returns providers that are NOT in outage
   */
  async getHealthyProviders(zone) {
    const providers = this.getProvidersForZone(zone);
    const outages = await providerOutageService.getActiveOutages();

    const outageNames = outages.map((o) => o.provider);

    return providers.filter((p) => !outageNames.includes(p.name));
  },

  /**
   * Returns best provider for routing
   * based on:
   *  - residency zone
   *  - outages
   *  - performance score
   *  - priority
   */
  async selectBestProvider(zone) {
    const healthyProviders = await this.getHealthyProviders(zone);

    if (healthyProviders.length === 0) {
      throw new Error(`No healthy providers available for zone: ${zone}`);
    }

    const performance = await providerPerformanceService.getPerformanceSummary();

    return healthyProviders
      .map((p) => ({
        ...p,
        score: performance[p.name]?.score || 0
      }))
      .sort((a, b) => {
        // Higher score wins; tie-breaker = priority
        if (b.score !== a.score) return b.score - a.score;
        return a.priority - b.priority;
      })[0];
  }
};
