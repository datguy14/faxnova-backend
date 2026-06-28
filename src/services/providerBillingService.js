// src/services/providerBillingService.js

/**
 * Provider Billing Service (FaxNova v1)
 *
 * Responsibilities:
 * - Compute per‑fax cost using unified OutboundFax model
 * - Residency + provider + tier aware
 * - Deterministic pricing for analytics + invoices
 */

const FaxNovaError = require("../errors/FaxNovaError");

// Unified provider base rates
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

// Unified tier multipliers
const tierMultipliers = {
  basic: 1.0,
  pro: 0.9,
  enterprise: 0.8
};

/**
 * Compute cost for a single outbound fax
 */
function computeFaxCost(outboundFax) {
  if (!outboundFax) {
    throw new FaxNovaError("Missing outbound fax record", {
      code: "BILLING_FAX_MISSING"
    });
  }

  const {
    provider,
    pages,
    residencyZone,
    tier,
    faxId
  } = outboundFax;

  if (!provider || !pages || !residencyZone || !tier) {
    throw new FaxNovaError("Outbound fax missing billing fields", {
      code: "BILLING_FIELDS_MISSING",
      faxId
    });
  }

  const providerRates = baseRates[provider];
  if (!providerRates) {
    throw new FaxNovaError("Invalid provider for billing", {
      code: "BILLING_PROVIDER_INVALID",
      provider,
      faxId
    });
  }

  const rate = providerRates[residencyZone] || providerRates.global;
  const multiplier = tierMultipliers[tier] || tierMultipliers.basic;

  const cost = +(pages * rate * multiplier).toFixed(4);

  return {
    faxId,
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
