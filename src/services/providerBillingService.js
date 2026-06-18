// src/services/providerBillingService.js
import { providerRoutingRules } from "./providerRoutingRules.js";

/**
 * Provider Billing Service
 * ------------------------
 * Computes:
 *  - cost per page
 *  - residency-based pricing
 *  - tier-based discounts
 *  - provider cost scoring
 */

const BASE_PRICING = {
  us: 0.05,
  ca: 0.06,
  eu: 0.07,
  latam: 0.09,
  global: 0.10
};

const TIER_DISCOUNTS = {
  basic: 0,
  pro: 0.10,        // 10% discount
  enterprise: 0.20  // 20% discount
};

export const providerBillingService = {
  /**
   * Compute cost for a single fax.
   */
  computeFaxCost({ provider, pages, residencyZone, tier }) {
    const baseRate = BASE_PRICING[residencyZone] || BASE_PRICING.global;
    const providerMeta = providerRoutingRules
      .getAllProviders()
      .find((p) => p.name === provider);

    const providerCostMultiplier = providerMeta?.cost || 1.0;
    const discount = TIER_DISCOUNTS[tier] || 0;

    const rawCost = pages * baseRate * providerCostMultiplier;
    const finalCost = rawCost * (1 - discount);

    return {
      provider,
      pages,
      residencyZone,
      tier,
      baseRate,
      providerCostMultiplier,
      discount,
      rawCost: Number(rawCost.toFixed(4)),
      finalCost: Number(finalCost.toFixed(4))
    };
  },

  /**
   * Dashboard summary for all providers.
   */
  getBillingSummary(tier = "basic") {
    const providers = providerRoutingRules.getAllProviders();

    return providers.map((p) => {
      const zones = p.zones;

      const zonePricing = zones.map((zone) => {
        const baseRate = BASE_PRICING[zone] || BASE_PRICING.global;
        const discount = TIER_DISCOUNTS[tier] || 0;

        return {
          zone,
          baseRate,
          providerCostMultiplier: p.cost,
          discountedRate: Number((baseRate * p.cost * (1 - discount)).toFixed(4))
        };
      });

      return {
        provider: p.name,
        weight: p.weight,
        cost: p.cost,
        zones: zonePricing
      };
    });
  }
};
