// src/services/providerBillingService.js

const FaxNovaError = require("../errors/FaxNovaError");

/**
 * Billing Engine v2
 *
 * Produces:
 * - cost per fax
 * - billing score (0–100) for Routing Engine v2
 *
 * Billing score is inverted cost:
 * - cheaper provider → higher score
 * - expensive provider → lower score
 *
 * Score formula:
 *   score = 100 - (normalizedCost * 100)
 *
 * Normalized cost = cost / MAX_COST
 */

const MAX_COST = 0.25; // highest possible cost per fax (for normalization)

// Base provider rates (per page)
const providerRates = {
  sinch: 0.04,
  telnyx: 0.05
};

// Residency zone multipliers
const residencyMultipliers = {
  us: 1.0,
  eu: 1.15,
  global: 1.25
};

// Tier multipliers
const tierMultipliers = {
  basic: 1.0,
  pro: 0.9,
  enterprise: 0.8
};

/**
 * Compute cost for a fax
 */
function computeFaxCost({ provider, pages, residencyZone, tier }) {
  if (!providerRates[provider]) {
    throw new FaxNovaError("Invalid provider for billing", {
      code: "BILLING_PROVIDER_INVALID",
      provider
    });
  }

  const baseRate = providerRates[provider];
  const residencyMultiplier = residencyMultipliers[residencyZone] || 1.0;
  const tierMultiplier = tierMultipliers[tier] || 1.0;

  const cost = baseRate * pages * residencyMultiplier * tierMultiplier;

  return {
    provider,
    pages,
    residencyZone,
    tier,
    cost: Number(cost.toFixed(4))
  };
}

/**
 * Billing score (0–100)
 *
 * Lower cost → higher score
 */
function getBillingScore(provider) {
  if (!providerRates[provider]) {
    throw new FaxNovaError("Invalid provider for billing score", {
      code: "BILLING_PROVIDER_INVALID",
      provider
    });
  }

  // Assume average fax:
  const avgPages = 3;
  const residencyZone = "us";
  const tier = "basic";

  const { cost } = computeFaxCost({
    provider,
    pages: avgPages,
    residencyZone,
    tier
  });

  const normalized = Math.min(cost / MAX_COST, 1);
  const score = Math.round(100 * (1 - normalized));

  return score;
}

module.exports = {
  computeFaxCost,
  getBillingScore
};
