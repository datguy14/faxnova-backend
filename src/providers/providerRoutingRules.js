// src/providers/providerRoutingRules.js

/**
 * Provider Routing Rules (FaxNova v1, Routing Engine v2)
 *
 * Responsibilities:
 * - Define provider metadata
 * - Apply tier rules
 * - Apply residency rules
 * - Score providers deterministically
 */

const FaxNovaError = require("../errors/FaxNovaError");

// ---------------------------------------------
// Provider Definitions (Sinch + Telnyx only)
// ---------------------------------------------
const providers = {
  sinch: {
    name: "sinch",
    weight: 0.65,
    costPerPage: 0.04,
    zones: ["us", "global"],
    tiers: ["basic", "pro", "enterprise"]
  },

  telnyx: {
    name: "telnyx",
    weight: 0.35,
    costPerPage: 0.03,
    zones: ["us", "eu", "global"],
    tiers: ["basic", "pro", "enterprise"]
  }
};

// ---------------------------------------------
// Residency Rule
// ---------------------------------------------
function applyResidencyRule(provider, residencyZone) {
  return provider.zones.includes(residencyZone);
}

// ---------------------------------------------
// Tier Rule
// ---------------------------------------------
function applyTierRule(provider, tier) {
  return provider.tiers.includes(tier);
}

// ---------------------------------------------
// Provider Scoring Engine (Routing Engine v2)
// ---------------------------------------------
function scoreProvider(provider, residencyZone, tier) {
  let score = 0;

  // Base weight
  score += provider.weight * 100;

  // Residency bonus
  if (provider.zones.includes(residencyZone)) {
    score += 25;
  }

  // Tier bonus
  if (provider.tiers.includes(tier)) {
    score += 15;
  }

  // Cost penalty (lower cost = higher score)
  score += (1 / provider.costPerPage) * 10;

  return Math.round(score);
}

// ---------------------------------------------
// Filter Providers
// ---------------------------------------------
function filterProviders({ residencyZone, tier }) {
  return Object.values(providers).filter((provider) => {
    const residencyOk = applyResidencyRule(provider, residencyZone);
    const tierOk = applyTierRule(provider, tier);
    return residencyOk && tierOk;
  });
}

// ---------------------------------------------
// Select Best Provider
// ---------------------------------------------
function selectBestProvider({ residencyZone, tier }) {
  const candidates = filterProviders({ residencyZone, tier });

  if (!candidates.length) {
    throw new FaxNovaError("No providers available for routing", {
      code: "NO_PROVIDERS_AVAILABLE",
      residencyZone,
      tier
    });
  }

  const scored = candidates.map((provider) => ({
    provider: provider.name,
    score: scoreProvider(provider, residencyZone, tier)
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored[0];
}

module.exports = {
  providers,
  filterProviders,
  selectBestProvider,
  scoreProvider,
  applyResidencyRule,
  applyTierRule
};
