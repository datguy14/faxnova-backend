// src/services/providerBillingService.js

const providerRoutingRules = require("./providerRoutingRules");
const FaxNovaError = require("../errors/FaxNovaError");

/**
 * Billing model:
 * - Base cost per page varies by provider
 * - Residency zone adjusts cost (US cheaper, EU/INTL more expensive)
 * - Tier applies discount (pro/enterprise)
 */

const ZONE_MULTIPLIERS = {
  us: 1.0,
  ca: 1.1,
  eu: 1.2,
  latam: 1.15,
  intl: 1.3
};

const TIER_DISCOUNTS = {
  basic: 0,
  pro: 0.05,
  enterprise: 0.12
};

module.exports = {
  /**
   * Compute cost for a single fax.
   */
  computeFaxCost({ provider, pages, residencyZone, tier }) {
    const providerMeta = providerRoutingRules.getProvider(provider);

    if (!providerMeta) {
      throw new FaxNovaError("Unknown provider", {
        code: "UNKNOWN_PROVIDER",
        provider
      });
    }

    if (!ZONE_MULTIPLIERS[residencyZone]) {
      throw new FaxNovaError("Invalid residency zone", {
        code: "INVALID_ZONE",
        details: { residencyZone }
      });
    }

    if (!TIER_DISCOUNTS.hasOwnProperty(tier)) {
      throw new FaxNovaError("Invalid tier", {
        code: "INVALID_TIER",
        details: { tier }
      });
    }

    const baseCost = providerMeta.cost; // providerRoutingRules defines cost
    const zoneMultiplier = ZONE_MULTIPLIERS[residencyZone];
    const discount = TIER_DISCOUNTS[tier];

    const rawCost = pages * baseCost * zoneMultiplier;
    const finalCost = rawCost * (1 - discount);

    return {
      provider,
      pages,
      residencyZone,
      tier,
      baseCost,
      zoneMultiplier,
      discount,
      total: Number(finalCost.toFixed(4))
    };
  },

  /**
   * Billing summary for dashboard.
   */
  getBillingSummary(tier = "basic") {
    const providers = providerRoutingRules.getAllProviders();

    if (!TIER_DISCOUNTS.hasOwnProperty(tier)) {
      throw new FaxNovaError("Invalid tier for summary", {
        code: "INVALID_TIER",
        details: { tier }
      });
    }

    return providers.map((p) => ({
      provider: p.name,
      baseCost: p.cost,
      tiers: p.tiers,
      discountApplied: TIER_DISCOUNTS[tier],
      effectiveCost: Number((p.cost * (1 - TIER_DISCOUNTS[tier])).toFixed(4))
    }));
  },

  /**
   * Legacy compatibility — returns all billing rates.
   */
  getBilling() {
    const providers = providerRoutingRules.getAllProviders();

    return providers.map((p) => ({
      provider: p.name,
      cost: p.cost,
      zones: p.zones,
      tiers: p.tiers
    }));
  }
};
