// src/services/providerRoutingRules.js

/**
 * Provider definitions for FaxNova v1.
 * Each provider has:
 * - name
 * - weight (routing priority)
 * - zones (residency zones it supports)
 * - tiers (API key tiers allowed)
 * - cost (relative cost score)
 */

const PROVIDERS = [
  {
    name: "sinch",
    weight: 0.9,
    zones: ["us", "ca", "latam"],
    tiers: ["basic", "pro", "enterprise"],
    cost: 1.0
  },
  {
    name: "telnyx",
    weight: 0.7,
    zones: ["us", "eu"],
    tiers: ["basic", "pro", "enterprise"],
    cost: 0.9
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
   * Return providers that support a specific residency zone.
   */
  getProvidersForZone(zone) {
    return PROVIDERS.filter((p) => p.zones.includes(zone));
  },

  /**
   * Check if provider is allowed for a given country.
   * Country → zone mapping handled upstream.
   */
  isAllowedForCountry(providerName, zone) {
    const provider = PROVIDERS.find((p) => p.name === providerName);
    if (!provider) return false;
    return provider.zones.includes(zone);
  },

  /**
   * Apply API key tier rules.
   * Removes providers that the tier is not allowed to use.
   */
  applyTierRules(providers, tier) {
    return providers.filter((p) => p.tiers.includes(tier));
  },

  /**
   * Check if provider is allowed for a given tier.
   */
  isAllowedForTier(providerName, tier) {
    const provider = PROVIDERS.find((p) => p.name === providerName);
    if (!provider) return false;
    return provider.tiers.includes(tier);
  },

  /**
   * Get provider metadata by name.
   */
  getProvider(providerName) {
    return PROVIDERS.find((p) => p.name === providerName) || null;
  }
};
