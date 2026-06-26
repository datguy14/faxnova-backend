// src/services/providerPerformanceService.js

const FaxNovaError = require("../errors/FaxNovaError");

// In-memory performance store (can be replaced with Redis later)
const metrics = {
  sinch: {
    successes: 0,
    failures: 0,
    latencySamples: []
  },
  telnyx: {
    successes: 0,
    failures: 0,
    latencySamples: []
  }
};

function recordLatencySample(provider, ms) {
  const arr = metrics[provider].latencySamples;
  arr.push(ms);

  // Keep last 50 samples for rolling average
  if (arr.length > 50) arr.shift();
}

function computeAvgLatency(provider) {
  const arr = metrics[provider].latencySamples;
  if (!arr.length) return 500; // default fallback
  const sum = arr.reduce((a, b) => a + b, 0);
  return Math.round(sum / arr.length);
}

function computeSuccessRate(provider) {
  const { successes, failures } = metrics[provider];
  const total = successes + failures;
  if (total === 0) return 0.95; // default fallback
  return Number((successes / total).toFixed(3));
}

module.exports = {
  /**
   * Record latency for a provider.
   */
  async recordLatency(provider, ms) {
    if (!metrics[provider]) {
      throw new FaxNovaError("Unknown provider for latency tracking", {
        code: "UNKNOWN_PROVIDER",
        provider
      });
    }

    recordLatencySample(provider, ms);
  },

  /**
   * Record a successful fax send.
   */
  async recordSuccess(provider) {
    if (!metrics[provider]) {
      throw new FaxNovaError("Unknown provider for success tracking", {
        code: "UNKNOWN_PROVIDER",
        provider
      });
    }

    metrics[provider].successes += 1;
  },

  /**
   * Record a failed fax send.
   */
  async recordFailure(provider) {
    if (!metrics[provider]) {
      throw new FaxNovaError("Unknown provider for failure tracking", {
        code: "UNKNOWN_PROVIDER",
        provider
      });
    }

    metrics[provider].failures += 1;
  },

  /**
   * Return normalized performance scores for Routing Engine v2.
   *
   * {
   *   sinch: {
   *     latency: 320,
   *     successRate: 0.97
   *   },
   *   telnyx: {
   *     latency: 410,
   *     successRate: 0.92
   *   }
   * }
   */
  async getPerformanceScores() {
    try {
      return {
        sinch: {
          latency: computeAvgLatency("sinch"),
          successRate: computeSuccessRate("sinch")
        },
        telnyx: {
          latency: computeAvgLatency("telnyx"),
          successRate: computeSuccessRate("telnyx")
        }
      };
    } catch (err) {
      throw new FaxNovaError("Failed to compute provider performance", {
        code: "PERFORMANCE_COMPUTE_ERROR",
        details: err.message
      });
    }
  }
};
