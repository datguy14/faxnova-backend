// src/services/providerBillingService.js

const providerRoutingRules = require("./providerRoutingRules");
const FaxNovaError = require("../errors/FaxNovaError");

/**
 * Billing Engine v1
 *
 * Computes:
 * - base cost per page (provider)
 * - residency multipliers
 * - tier discounts
 * - effective cost per page
 */

const TIER_DISCOUNTS = {
  basic: 0,
  pro: 0.10,
  enterprise: 0.20
};

const RESIDENCY_MULTIPLIERS = {
  us: 1.0,
  eu: 1.15,
  apac: 1.25,
  latam: 1.10
};

module.exports = {
  /**
   * Compute cost for a single fax.
   */
  computeFaxCost({ provider, pages, residencyZone, tier }) {
    const rules = providerRoutingRules.getProvider(provider);

    if (!rules) {
      throw new FaxNovaError("Unknown provider for billing", {
        code: "UNKNOWN_PROVIDER",
        provider
      });
    }

    const baseRate = rules.costPerPage;
    const residencyMultiplier = RESIDENCY_MULTIPLIERS[residencyZone] ?? 1.0;
    const tierDiscount = TIER_DISCOUNTS[tier] ?? 0;

    const effectiveRate = baseRate * residencyMultiplier * (1 - tierDiscount);
    const totalCost = Number((effectiveRate * pages).toFixed(4));

    return {
      provider,
      pages,
      baseRate,
      residencyZone,
      residencyMultiplier,
      tier,
      tierDiscount,
      effectiveRate: Number(effectiveRate.toFixed(4)),
      totalCost
    };
  },

  /**
   * Billing summary for all providers (dashboard).
   */
  getBillingSummary(tier = "basic") {
    const providers = providerRoutingRules.getAllProviders();

    if (!providers || providers.length === 0) {
      throw new FaxNovaError("No providers available for billing summary", {
        code: "NO_PROVIDERS"
      });
    }

    const tierDiscount = TIER_DISCOUNTS[tier] ?? 0;

    return providers.map((p) => {
      const residencyMultiplier = 1.0; // summary is residency‑agnostic
      const effectiveCost = p.costPerPage * residencyMultiplier * (1 - tierDiscount);

      return {
        provider: p.name,
        baseRate: p.costPerPage,
        tier,
        tierDiscount,
        effectiveCost: Number(effectiveCost.toFixed(4))
      };
    });
  }
};
