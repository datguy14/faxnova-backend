// src/services/routingService.v2.js

const providerHealthService = require("./providerHealthService");
const providerBillingService = require("./providerBillingService");
const providerRoutingRules = require("./providerRoutingRules");

const FaxNovaError = require("../errors/FaxNovaError");

/**
 * Routing Engine v2
 *
 * Scoring Weights:
 * - latency:   25%
 * - success:   30%
 * - cost:      20%
 * - residency: 15%
 * - outage:    10%
 */

const WEIGHTS = {
  latency: 0.25,
  success: 0.30,
  cost: 0.20,
  residency: 0.15,
  outage: 0.10
};

/**
 * Normalize latency score (0–1)
 */
function normalizeLatency(ms) {
  if (!ms) return 0.5;
  if (ms <= 200) return 1.0;
  if (ms <= 800) return 0.5;
  return 0.2;
}

/**
 * Normalize cost score (0–1)
 */
function normalizeCost(ratePerPage) {
  if (!ratePerPage) return 0.5;
  if (ratePerPage <= 0.03) return 1.0;
  if (ratePerPage <= 0.06) return 0.6;
  return 0.3;
}

module.exports = {
  /**
   * Select best provider + failover using Routing Engine v2.
   */
  async selectProvider({ residencyZone, tier }) {
    // -----------------------------
    // 1. Load provider metadata
    // -----------------------------
    const providers = providerRoutingRules.getAllProviders();

    if (!providers || providers.length === 0) {
      throw new FaxNovaError("No providers available", {
        code: "NO_PROVIDERS"
      });
    }

    // -----------------------------
    // 2. Load health + billing data
    // -----------------------------
    const health = await providerHealthService.getCurrentHealth();
    const billing = await providerBillingService.getBillingSummary(tier);

    // -----------------------------
    // 3. Score each provider
    // -----------------------------
    const scored = providers.map((p) => {
      const h = health[p.name];
      const b = billing.find((x) => x.provider === p.name);

      const latencyScore = normalizeLatency(h?.avgLatencyMs);
      const successScore = h?.successRate ?? 0;
      const costScore = normalizeCost(b?.effectiveCost);
      const residencyScore = p.zones.includes(residencyZone) ? 1 : 0;
      const outageScore = h?.activeOutage ? 0 : 1;

      const score =
        WEIGHTS.latency * latencyScore +
        WEIGHTS.success * successScore +
        WEIGHTS.cost * costScore +
        WEIGHTS.residency * residencyScore +
        WEIGHTS.outage * outageScore;

      return {
        provider: p.name,
        score,
        metrics: {
          latencyScore,
          successScore,
          costScore,
          residencyScore,
          outageScore
        }
      };
    });

    // -----------------------------
    // 4. Sort by score (descending)
    // -----------------------------
    scored.sort((a, b) => b.score - a.score);

    const primary = scored[0];
    const failover = scored[1] || null;

    if (!primary) {
      throw new FaxNovaError("Routing engine failed to select provider", {
        code: "ROUTING_FAILURE"
      });
    }

    return {
      primary,
      failover,
      scored
    };
  }
};
