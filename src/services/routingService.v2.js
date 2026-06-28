// src/services/routingService.v2.js

const FaxNovaError = require("../errors/FaxNovaError");
const providerRoutingRules = require("../providers/providerRoutingRules");
const providerPerformanceService = require("./providerPerformanceService");
const providerOutageService = require("./providerOutageService");
const providerBillingService = require("./providerBillingService");

/**
 * Routing Engine v2
 *
 * Inputs:
 * - tenantId
 * - residencyZone
 * - tier
 *
 * Outputs:
 * {
 *   provider: "sinch" | "telnyx",
 *   failoverProvider: "sinch" | "telnyx" | null,
 *   score: Number
 * }
 */

async function selectProvider({ tenantId, residencyZone, tier }) {
  if (!tenantId) {
    throw new FaxNovaError("Missing tenant context", {
      code: "TENANT_CONTEXT_MISSING"
    });
  }

  // -----------------------------
  // 1. Load routing rules
  // -----------------------------
  const rules = providerRoutingRules.getRules({
    residencyZone,
    tier
  });

  if (!rules || !rules.providers) {
    throw new FaxNovaError("Routing rules missing for zone/tier", {
      code: "ROUTING_RULES_MISSING",
      residencyZone,
      tier
    });
  }

  const candidates = rules.providers; // ["sinch", "telnyx"]

  // -----------------------------
  // 2. Score each provider
  // -----------------------------
  const scoredProviders = [];

  for (const providerName of candidates) {
    // Health score (0–100)
    const healthScore = await providerPerformanceService.getHealthScore(providerName);

    // Outage score (0–100)
    const outageScore = await providerOutageService.getOutageScore(providerName);

    // Billing score (0–100)
    const billingScore = await providerBillingService.getBillingScore(providerName);

    // Weighted score
    const weightedScore =
      healthScore * rules.weights.health +
      outageScore * rules.weights.outage +
      billingScore * rules.weights.billing;

    scoredProviders.push({
      provider: providerName,
      healthScore,
      outageScore,
      billingScore,
      weightedScore
    });
  }

  // -----------------------------
  // 3. Sort by weighted score
  // -----------------------------
  scoredProviders.sort((a, b) => b.weightedScore - a.weightedScore);

  const primary = scoredProviders[0];
  const failover = scoredProviders[1] || null;

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
  selectProvider
};
