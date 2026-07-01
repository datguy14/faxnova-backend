// src/services/providerPerformanceService.js

const ERROR_WINDOW = 100; // last 100 events

const providerStats = {
  sinch: { score: 1.0, errors: [] },
  telnyx: { score: 1.0, errors: [] },
};

module.exports = {
  applySuccessBoost(provider) {
    const stats = providerStats[provider];
    stats.score = Math.min(stats.score + 0.05, 2.0);
  },

  applyFailurePenalty(provider) {
    const stats = providerStats[provider];
    stats.score = Math.max(stats.score - 0.1, 0.1);

    // Track rolling error window
    stats.errors.push(Date.now());
    if (stats.errors.length > ERROR_WINDOW) {
      stats.errors.shift();
    }
  },

  getErrorRate(provider) {
    const stats = providerStats[provider];
    return stats.errors.length / ERROR_WINDOW;
  },

  getScore(provider) {
    return providerStats[provider].score;
  },
};
