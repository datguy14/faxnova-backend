// src/services/providerPerformanceService.js

/**
 * Provider Performance Service
 *
 * Scores range 0–100 and are used by providerRouter.
 * These will later be stored in Redis, but for now
 * we keep them in-memory with a clean API.
 */

let scores = {
  sinch: 85,
  telnyx: 90
};

/**
 * Get current provider scores
 */
async function getScores() {
  return scores;
}

/**
 * Update provider score (0–100)
 */
async function updateScore(provider, score) {
  if (!scores[provider]) return;

  scores[provider] = Math.max(0, Math.min(100, score));
}

/**
 * Apply penalty after failure
 */
async function applyFailurePenalty(provider) {
  if (!scores[provider]) return;

  scores[provider] = Math.max(0, scores[provider] - 10);
}

/**
 * Apply reward after success
 */
async function applySuccessBoost(provider) {
  if (!scores[provider]) return;

  scores[provider] = Math.min(100, scores[provider] + 5);
}

module.exports = {
  getScores,
  updateScore,
  applyFailurePenalty,
  applySuccessBoost
};
