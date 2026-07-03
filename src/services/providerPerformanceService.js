// src/services/providerPerformanceService.js — STRICT-MODE VERSION

const redis = require("../lib/redis");

const KEY = "faxnova:providerPerformance";
const PROVIDERS = ["sinch", "telnyx"];

// Strict-mode scoring boundaries
const MIN_SCORE = 0;
const MAX_SCORE = 100;

// Strict-mode penalties & boosts
const SUCCESS_BOOST = 3;      // small boost for stability
const FAILURE_PENALTY = 12;   // heavier penalty for instability

// Latency thresholds (ms)
const LATENCY_SEVERE = 4000;
const LATENCY_CRITICAL = 6000;

module.exports = {
  /**
   * Get a provider's performance score (0–100)
   */
  async getScore(provider) {
    const raw = await redis.hget(KEY, provider);
    const score = raw ? Number(raw) : 80; // strict-mode baseline
    return Math.min(MAX_SCORE, Math.max(MIN_SCORE, score));
  },

  /**
   * Get all provider scores
   */
  async getScores() {
    const all = await redis.hgetall(KEY);
    const scores = {};

    for (const provider of PROVIDERS) {
      const raw = all?.[provider];
      scores[provider] = raw ? Number(raw) : 80;
    }

    return scores;
  },

  /**
   * Apply success boost (provider responded quickly + reliably)
   */
  async recordSuccess(provider) {
    const current = await this.getScore(provider);
    const updated = Math.min(MAX_SCORE, current + SUCCESS_BOOST);

    await redis.hset(KEY, provider, updated);
    return updated;
  },

  /**
   * Apply failure penalty (timeout, error, instability)
   */
  async recordFailure(provider) {
    const current = await this.getScore(provider);
    const updated = Math.max(MIN_SCORE, current - FAILURE_PENALTY);

    await redis.hset(KEY, provider, updated);
    return updated;
  },

  /**
   * Apply latency penalties based on EWMA + percentiles
   */
  async applyLatencyPenalty(provider, ewma, p95, p99) {
    let penalty = 0;

    if (ewma > LATENCY_CRITICAL || p99 > LATENCY_CRITICAL) {
      penalty += 20;
    } else if (ewma > LATENCY_SEVERE || p95 > LATENCY_SEVERE) {
      penalty += 10;
    }

    const current = await this.getScore(provider);
    const updated = Math.max(MIN_SCORE, current - penalty);

    await redis.hset(KEY, provider, updated);
    return updated;
  }
};
