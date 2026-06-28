// src/services/providerPerformanceService.js

const FaxNovaError = require("../errors/FaxNovaError");
// If you later track per‑provider metrics in Mongo, you can wire that model here:
// const ProviderPerformance = require("../models/ProviderPerformance");

/**
 * Get health score (0–100) for a provider.
 *
 * For now, this is a simple static/scaled implementation.
 * Later you can replace it with real metrics:
 * - success rate
 * - average latency
 * - error rate
 * - SLA breaches
 */
async function getHealthScore(providerName) {
  // Basic guard
  if (!["sinch", "telnyx"].includes(providerName)) {
    throw new FaxNovaError("Invalid provider for health score", {
      code: "PERFORMANCE_PROVIDER_INVALID",
      providerName
    });
  }

  // TODO: Replace with real metrics from DB or monitoring
  // Example shape if you add a ProviderPerformance model:
  //
  // const perf = await ProviderPerformance.findOne({ provider: providerName });
  // if (!perf) return 70; // default
  // return perf.healthScore; // 0–100

  // For now, simple defaults:
  switch (providerName) {
    case "sinch":
      return 90; // assume strong performance
    case "telnyx":
      return 88; // slightly lower but still strong
    default:
      return 70;
  }
}

module.exports = {
  getHealthScore
};
