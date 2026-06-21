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
    name: "interfax",
    weight: 0.8,
    zones: ["us", "eu", "global"],
    tiers: ["pro", "enterprise"],
    cost: 1.2
  },
  {
    name: "telnyx",
    weight: 0.7,
    zones: ["us", "eu"],
    tiers: ["basic", "pro", "enterprise"],
    cost: 0.9
  },
  {
    name: "twilio",
    weight: 0.6,
    zones: ["global"],
    tiers: ["enterprise"],
    cost: 1.5
  }
];

const providerRoutingRules = {
  getAllProviders() {
    return PROVIDERS;
  },

  getProvidersForZone(zone) {
    return PROVIDERS.filter((p) => p.zones.includes(zone));
  },

  applyTierRules(providers, tier) {
    return providers.filter((p) => p.tiers.includes(tier));
  }
};

module.exports = providerRoutingRules;
