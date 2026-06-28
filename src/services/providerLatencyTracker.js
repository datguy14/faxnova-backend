// src/services/providerLatencyTracker.js

/**
 * Provider Latency Tracker (FaxNova v1)
 *
 * Responsibilities:
 * - Track per‑provider latency for Routing Engine v2
 * - Feed latency into providerPerformanceService
 */

const providerPerformanceService = require("./providerPerformanceService");
const FaxNovaError = require("../errors/FaxNovaError");

/**
 * Track latency for a provider
 */
function trackLatency(provider, latencyMs) {
  try {
    if (!provider || typeof latencyMs !== "number") {
      throw new FaxNovaError("Invalid latency tracking fields", {
        code: "LATENCY_FIELDS_INVALID",
        provider,
        latencyMs
      });
    }

    providerPerformanceService.recordSuccess(provider, latencyMs);

    return {
      provider,
      latencyMs,
      avgLatency: providerPerformanceService.computeScore(provider)
    };
  } catch (err) {
    throw new FaxNovaError("Latency tracking failed", {
      code: "LATENCY_TRACK_FAILED",
      details: err.message
    });
  }
}

module.exports = { trackLatency };
