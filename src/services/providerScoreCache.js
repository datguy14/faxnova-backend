// src/services/providerScoreCache.js

/**
 * Provider Score Cache (FaxNova v1)
 *
 * Responsibilities:
 * - Cache provider scores for Routing Engine v2
 * - Prevent repeated scoring calls inside providerRouter
 * - Keep cache extremely lightweight + fast
 */

const NodeCache = require("node-cache");
const providerPerformanceService = require("./providerPerformanceService");
const FaxNovaError = require("../errors/FaxNovaError");

const cache = new NodeCache({
  stdTTL: 5,        // scores expire every 5 seconds
  checkperiod: 5
});

/**
 * Get cached provider scores or compute fresh ones
 */
async function getScores() {
  try {
    const cached = cache.get("providerScores");
    if (cached) return cached;

    const scores = await providerPerformanceService.getScores();
    cache.set("providerScores", scores);
    return scores;
  } catch (err) {
    throw new FaxNovaError("Failed to get provider scores", {
      code: "SCORE_CACHE_FAILED",
      details: err.message
    });
  }
}

/**
 * Force refresh (used by admin dashboard or debugging)
 */
async function refreshScores() {
  const scores = await providerPerformanceService.getScores();
  cache.set("providerScores", scores);
  return scores;
}

module.exports = {
  getScores,
  refreshScores
};
