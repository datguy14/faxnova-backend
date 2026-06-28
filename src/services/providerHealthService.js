// src/services/providerHealthService.js

const FaxNovaError = require("../errors/FaxNovaError");
const providerPerformanceService = require("./providerPerformanceService");
const providerOutageService = require("./providerOutageService");
const providerBillingService = require("./providerBillingService");

/**
 * Provider Health Service (Routing Engine v2)
 *
 * Returns:
 * {
 *   sinch: {
 *     avgLatencyMs,
 *     successRate,
 *     activeOutage,
 *     healthScore,
 *     outageScore,
 *     billingScore
 *   },
 *   telnyx: { ...same }
 * }
 */

async function getCurrentHealth() {
  try {
    const providers = ["sinch", "telnyx"];
    const health = {};

    for (const provider of providers) {
      // Performance metrics (latency + success rate)
      const perfScore = await providerPerformanceService.getHealthScore(provider);

      // Outage score (0–100)
      const outageScore = providerOutageService.getOutageScore(provider);

      // Billing score (0–100)
      const billingScore = providerBillingService.getBillingScore(provider);

      // Active outage?
      const activeOutages = providerOutageService.getActiveOutages();
      const activeOutage = activeOutages.includes(provider);

      // Build health object
      health[provider] = {
        avgLatencyMs: perfScore >= 90 ? 450 : 600, // placeholder until real metrics
        successRate: perfScore >= 90 ? 0.97 : 0.93,
        activeOutage,
        healthScore: perfScore,
        outageScore,
        billingScore
      };
    }

    return health;
  } catch (err) {
    throw new FaxNovaError("Failed to load provider health", {
      code: "PROVIDER_HEALTH_FAILED",
      details: err.message
    });
  }
}

module.exports = {
  getCurrentHealth
};
