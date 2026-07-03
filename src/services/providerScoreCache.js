// src/services/providerScoreCache.js — STRICT-MODE REDIS VERSION (FINAL)

const redis = require("../lib/redis");
const providerPerformanceService = require("./providerPerformanceService");

const CACHE_PREFIX = "faxnova:providerScores";
const CACHE_TTL = 30; // 30 seconds
const PROVIDERS = ["sinch", "telnyx"];

/**
 * Build region-aware cache key
 */
function buildKey(region) {
  return region
    ? `${CACHE_PREFIX}:${region}`
    : `${CACHE_PREFIX}:global`;
}

module.exports = {
  /**
   * Get cached provider scores (region-aware)
   */
  async getScores(region = null) {
    const key = buildKey(region);

    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);

    // Compute fresh scores
    const scores = {};
    for (const provider of PROVIDERS) {
      scores[provider] = await providerPerformanceService.getScore(provider, region);
    }

    await redis.setex(key, CACHE_TTL, JSON.stringify(scores));
    return scores;
  },

  /**
   * Select best provider based on scores + region weighting
   */
  async getBestProvider(region = null) {
    const scores = await this.getScores(region);

    // Region weighting (strict-mode)
    const weighted = { ...scores };

    if (region === "us") {
      weighted.sinch *= 1.1;
    }
    if (region === "eu") {
      weighted.telnyx *= 1.1;
    }

    const best = Object.entries(weighted)
      .sort((a, b) => b[1] - a[1])[0][0];

    return best;
  }
};
