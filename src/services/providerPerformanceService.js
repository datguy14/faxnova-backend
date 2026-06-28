// src/services/providerPerformanceService.js

/**
 * Provider Performance Service (FaxNova v1)
 *
 * Responsibilities:
 * - Track provider latency
 * - Track success/failure counts
 * - Compute rolling performance score
 * - Feed Routing Engine v2
 */

const FaxNovaError = require("../errors/FaxNovaError");

// In-memory performance store (Redis-ready structure)
const performanceStore = {
  sinch: {
    successes: 0,
    failures: 0,
    avgLatency: 0
  },
  telnyx: {
    successes: 0,
    failures: 0,
    avgLatency: 0
  }
};

/**
 * Update latency (rolling average)
 */
function updateLatency(provider, latencyMs) {
  const p = performanceStore[provider];
  if (!p) return;

  if (p.avgLatency === 0) {
    p.avgLatency = latencyMs;
  } else {
    p.avgLatency = Math.round((p.avgLatency + latencyMs) / 2);
  }
}

/**
 * Record success
 */
function recordSuccess(provider, latencyMs) {
  const p = performanceStore[provider];
  if (!p) return;

  p.successes += 1;
  updateLatency(provider, latencyMs);
}

/**
 * Record failure
 */
function recordFailure(provider) {
  const p = performanceStore[provider];
  if (!p) return;

  p.failures += 1;
}

/**
 * Compute performance score
 *
 * Formula:
 *   base = successes * 2
 *   penalty = failures * 3
 *   latencyPenalty = avgLatency / 50
 *
 *   finalScore = base - penalty - latencyPenalty
 */
function computeScore(provider) {
  const p = performanceStore[provider];
  if (!p) return 0;

  const base = p.successes * 2;
  const penalty = p.failures * 3;
  const latencyPenalty = Math.round(p.avgLatency / 50);

  return Math.max(0, base - penalty - latencyPenalty);
}

/**
 * Get all provider scores
 */
async function getScores() {
  return {
    sinch: computeScore("sinch"),
    telnyx: computeScore("telnyx")
  };
}

module.exports = {
  recordSuccess,
  recordFailure,
  getScores,
  computeScore
};
