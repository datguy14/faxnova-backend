// src/services/providerPerformanceService.js

const redis = require("../lib/redis");

const KEY = "faxnova:providerPerformance";
const PROVIDERS = ["sinch", "telnyx"];

// Score boundaries
const MIN_SCORE = 0;
const MAX_SCORE = 100;

// Boost / penalty values
const SUCCESS_BOOST = 5;
const FAILURE_PENALTY = 10;

module.exports = {
  async getScore(provider) {
    const raw = await redis.hget(KEY, provider);
    const score = raw ? Number(raw) : 80; // default baseline
    return Math.min(MAX_SCORE, Math.max(MIN_SCORE, score));
  },

  async getScores() {
    const all = await redis.hgetall(KEY);
    const scores = {};

    for (const provider of PROVIDERS) {
      const raw = all[provider];
      scores[provider] = raw ? Number(raw) : 80;
    }

    return scores;
  },

  async applySuccessBoost(provider) {
    const current = await this.getScore(provider);
    const updated = Math.min(MAX_SCORE, current + SUCCESS_BOOST);

    await redis.hset(KEY, provider, updated);
    return updated;
  },

  async applyFailurePenalty(provider) {
    const current = await this.getScore(provider);
    const updated = Math.max(MIN_SCORE, current - FAILURE_PENALTY);

    await redis.hset(KEY, provider, updated);
    return updated;
  }
};
