// src/services/providerPerformanceService.js

const providerScoreCache = require("./providerScoreCache");

// Sovereignty scoring model
const DEFAULT_SCORE = 100;
const MIN_SCORE = 10;
const MAX_SCORE = 200;

const BOOST_AMOUNT = 15;     // success
const PENALTY_AMOUNT = 25;   // failure

module.exports = {
  // ---------------------------------------------------------
  // Get provider score
  // ---------------------------------------------------------
  getScore(provider) {
    const score = providerScoreCache.get(provider);
    return score ?? DEFAULT_SCORE;
  },

  // ---------------------------------------------------------
  // Set provider score manually
  // ---------------------------------------------------------
  setScore(provider, score) {
    const clamped = Math.max(MIN_SCORE, Math.min(MAX_SCORE, score));
    providerScoreCache.set(provider, clamped);
    return clamped;
  },

  // ---------------------------------------------------------
  // Apply success boost
  // ---------------------------------------------------------
  applySuccessBoost(provider) {
    const current = this.getScore(provider);
    const updated = Math.min(MAX_SCORE, current + BOOST_AMOUNT);

    providerScoreCache.set(provider, updated);

    return {
      provider,
      previous: current,
      updated,
      change: +BOOST_AMOUNT,
    };
  },

  // ---------------------------------------------------------
  // Apply failure penalty
  // ---------------------------------------------------------
  applyFailurePenalty(provider) {
    const current = this.getScore(provider);
    const updated = Math.max(MIN_SCORE, current - PENALTY_AMOUNT);

    providerScoreCache.set(provider, updated);

    return {
      provider,
      previous: current,
      updated,
      change: -PENALTY_AMOUNT,
    };
  },

  // ---------------------------------------------------------
  // Normalize score (routing engine safety)
  // ---------------------------------------------------------
  normalize(provider) {
    const current = this.getScore(provider);
    const normalized = Math.max(MIN_SCORE, Math.min(MAX_SCORE, current));

    providerScoreCache.set(provider, normalized);
    return normalized;
  },

  // ---------------------------------------------------------
  // Reset provider score to default
  // ---------------------------------------------------------
  reset(provider) {
    providerScoreCache.set(provider, DEFAULT_SCORE);
    return DEFAULT_SCORE;
  },
};
