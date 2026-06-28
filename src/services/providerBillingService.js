// src/services/providerBillingService.js

/**
 * Provider Billing Service (FaxNova v1)
 *
 * Responsibilities:
 * - Compute per‑fax cost
 * - Provide billing summary by tier
 * - Residency + provider + tier aware
 */

const FaxNovaError = require("../errors/FaxNovaError");

const baseRates = {
  sinch: {
    us: 0.04,
    global: 0.05
  },
  telnyx: {
    us: 0.03,
    eu: 0.035,
    global: 0.045
  }
};

const tierMultipliers = {
  basic: 1.0,
  pro: 0.9,
  enterprise: 0.8
};

/**
 * Compute cost for a single fax
 */
function computeFaxCost({ provider, pages, residencyZone, tier }) {
  if (!provider || !pages || !residencyZone || !tier) {
    throw new FaxNovaError("Missing billing fields", {
      code: "BILLING_FIELDS_MISSING"
    });
  }

  const providerRates = baseRates[provider];
  if (!providerRates) {
    throw new FaxNovaError("Invalid provider for billing", {
      code: "BILLING_PROVIDER_INVALID",
      provider
    });
  }

  const rate = providerRates[residencyZone] || providerRates.global;
  const multiplier = tierMultipliers[tier] || tierMultipliers.basic;

  const cost = +(pages * rate * multiplier).toFixed(4);

  return {
    provider,
    pages,
    residencyZone,
    tier,
    rate,
    multiplier,
    cost
  };
}

/**
 * Billing summary for dashboard
 */
function getBillingSummary(tier = "basic") {
  const multiplier = tierMultipliers[tier] || tierMultipliers.basic;

  const summary = Object.entries(baseRates).map(([provider, zones]) => {
    const zoneRates = Object.entries(zones).map(([zone, rate]) => ({
      zone,
      rate,
      effectiveRate: +(rate * multiplier).toFixed(4)
    }));

    return {
      provider,
      tier,
      multiplier,
      zones: zoneRates
    };
  });

  return summary;
}

module.exports = {
  computeFaxCost,
  getBillingSummary
};
