// src/services/providerRoutingRules.js

/**
 * Provider Routing Rules (FaxNova v1)
 *
 * Each provider includes:
 * - name
 * - weight (routing priority baseline)
 * - zones (residency zones supported)
 * - tiers (API key tiers allowed)
 * - costPerPage (billing engine base rate)
 */

const PROVIDERS = [
  {
    name: "sinch",
    weight: 0.9,
    zones: ["us", "ca", "latam"],
    tiers: ["basic", "pro", "enterprise"],
    costPerPage: 0.035
  },
  {
    name: "telnyx",
    weight: 0.8,
    zones: ["us", "eu"],
    tiers: ["basic", "pro", "enterprise"],
    costPerPage: 0.030
  }
];

module.exports = {
  /**
   * Return all providers.
   */
  getAllProviders() {
    return PROVIDERS;
  },

  /**
   * Return a single provider by name.
   */
  getProvider(name) {
    return PROVIDERS.find((p) => p.name === name) || null;
  },

  /**
   * Filter providers by residency zone.
   */
  getProvidersForZone(zone) {
    return PROVIDERS.filter((p) => p.zones.includes(zone));
  },

  /**
   * Apply tier rules.
   * Removes providers that the tier is not allowed to use.
   */
  applyTierRules(providers, tier) {
    return providers.filter((p) => p.tiers.includes(tier));
  }
};
