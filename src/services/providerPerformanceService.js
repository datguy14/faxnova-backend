// src/services/providerPerformanceService.js

/**
 * Unified Provider Performance Service
 * Tracks:
 *  - successes
 *  - failures
 *  - error rate
 *  - performance score
 */

const performanceState = {
  sinch: { successes: 0, failures: 0, score: 1.0 },
  telnyx: { successes: 0, failures: 0, score: 1.0 }
};

module.exports = {
  applySuccessBoost(provider) {
    const p = performanceState[provider];
    if (!p) return;

    p.successes += 1;

    // Positive reinforcement
    p.score = Math.min(p.score + 0.05, 2.0);
  },

  applyFailurePenalty(provider) {
    const p = performanceState[provider];
    if (!p) return;

    p.failures += 1;

    // Negative reinforcement
    p.score = Math.max(p.score - 0.1, 0.1);
  },

  getErrorRate(provider) {
    const p = performanceState[provider];
    if (!p) return 0;

    const total = p.successes + p.failures;
    if (total === 0) return 0;

    return p.failures / total;
  },

  getScore(provider) {
    return performanceState[provider]?.score || 1.0;
  },

  getDiagnostics(provider) {
    const p = performanceState[provider];

    return {
      provider,
      successes: p.successes,
      failures: p.failures,
      score: p.score,
      errorRate: this.getErrorRate(provider)
    };
  }
};
