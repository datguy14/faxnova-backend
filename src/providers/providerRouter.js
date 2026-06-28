// src/providers/providerRouter.js

const FaxNovaError = require("../errors/FaxNovaError");
const providerRoutingRules = require("./providerRoutingRules");
const providerPerformanceService = require("../services/providerPerformanceService");
const providerOutageService = require("../services/providerOutageService");
const providerBillingService = require("../services/providerBillingService");

/**
 * Provider Router (Routing Engine v2)
 *
 * Input:
 * {
 *   residencyZone,
 *   tier
 * }
 *
 * Output:
 * {
 *   provider: "sinch" | "telnyx",
 *   failoverProvider: "sinch" | "telnyx" | null,
 *   score: Number
 * }
 */

async function routeProvider({ residencyZone, tier }) {
  if (!residencyZone || !tier) {
    throw new FaxNovaError("Missing routing parameters", {
      code: "ROUTING_PARAMS_MISSING",
      residencyZone,
      tier
    });
  }

  // -----------------------------
  // 1. Load routing rules
  // -----------------------------
  const rules = providerRoutingRules.getRules({ residencyZone, tier });
  const candidates = rules.providers; // ["sinch", "telnyx"]

  // -----------------------------
  // 2. Score each provider
  // -----------------------------
  const scored = [];

  for (const provider of candidates) {
    // Health score (0–100)
    const healthScore = await providerPerformanceService.getHealthScore(provider);

    // Outage score (0–100)
    const outageScore = providerOutageService.getOutageScore(provider);

    // Billing score (0–100)
    const billingScore = providerBillingService.getBillingScore(provider);

    // Weighted score
    const weightedScore =
      healthScore * rules.weights.health +
      outageScore * rules.weights.outage +
      billingScore * rules.weights.billing;

    scored.push({
      provider,
      healthScore,
      outageScore,
      billingScore,
      weightedScore
    });
  }

  // -----------------------------
  // 3. Sort by weighted score
  // -----------------------------
  scored.sort((a, b) => b.weightedScore - a.weightedScore);

  const primary = scored[0];
  const failover = scored[1] || null;

  if (!primary) {
    throw new FaxNovaError("No valid provider available", {
      code: "NO_PROVIDER_AVAILABLE"
    });
  }

  return {
    provider: primary.provider,
    failoverProvider: failover ? failover.provider : null,
    score: primary.weightedScore
  };
}

module.exports = {
  routeProvider
};
