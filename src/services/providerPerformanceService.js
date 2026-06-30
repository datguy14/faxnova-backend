const providerScoreCache = require("./providerScoreCache");

// Score boundaries
const MIN_SCORE = 0;
const MAX_SCORE = 100;

// Default baseline score for new providers
const BASELINE_SCORE = 50;

// Performance adjustments
const FAILURE_PENALTY = 5;   // subtract 5 points on failure
const SUCCESS_BOOST = 3;     // add 3 points on success

// ---------------------------------------------------------
// Initialize provider score if missing
// ---------------------------------------------------------
exports.initializeScore = (provider) => {
  const existing = providerScoreCache.getScore(provider);
  if (existing === null || existing === undefined) {
    providerScoreCache.setScore(provider, BASELINE_SCORE);
    return BASELINE_SCORE;
  }
  return existing;
};

// ---------------------------------------------------------
// Get provider score
// ---------------------------------------------------------
exports.getScore = (provider) => {
  const score = providerScoreCache.getScore(provider);
  return score ?? BASELINE_SCORE;
};

// ---------------------------------------------------------
// Set provider score (clamped between 0–100)
// ---------------------------------------------------------
exports.setScore = (provider, score) => {
  const clamped = Math.max(MIN_SCORE, Math.min(MAX_SCORE, score));
  providerScoreCache.setScore(provider, clamped);
  return clamped;
};

// ---------------------------------------------------------
// Apply failure penalty
// ---------------------------------------------------------
exports.applyFailurePenalty = async (provider) => {
  const current = providerScoreCache.getScore(provider) ?? BASELINE_SCORE;
  const updated = Math.max(MIN_SCORE, current - FAILURE_PENALTY);

  providerScoreCache.setScore(provider, updated);
  return updated;
};

// ---------------------------------------------------------
// Apply success boost
// ---------------------------------------------------------
exports.applySuccessBoost = async (provider) => {
  const current = providerScoreCache.getScore(provider) ?? BASELINE_SCORE;
  const updated = Math.min(MAX_SCORE, current + SUCCESS_BOOST);

  providerScoreCache.setScore(provider, updated);
  return updated;
};
