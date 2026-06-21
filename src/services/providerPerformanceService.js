const NodeCache = require("node-cache");
const audit = require("../audit/auditService");

/**
 * Provider Performance Service
 * ----------------------------
 * Tracks:
 *  - latency
 *  - success rate
 *  - failure rate
 *  - cost score (static from providerRoutingRules)
 *
 * Used by providerRouter to select the best provider.
 */

const PERFORMANCE_TTL = 10 * 60; // 10 minutes
const performanceCache = new NodeCache({
  stdTTL: PERFORMANCE_TTL,
  checkperiod: 60
});

// Structure:
// perf:{provider} = {
//   latencySamples: [ms, ms, ...],
//   successes: number,
//   failures: number,
//   lastUpdated: timestamp
// }

const providerPerformanceService = {
  /**
   * Record latency for a provider.
   */
  async recordLatency(provider, ms) {
    const key = `perf:${provider}`;
    const existing = performanceCache.get(key) || {
      latencySamples: [],
      successes: 0,
      failures: 0,
      lastUpdated: new Date()
    };

    existing.latencySamples.push(ms);
    existing.lastUpdated = new Date();

    performanceCache.set(key, existing);
    return existing;
  },

  /**
   * Record a successful fax delivery.
   */
  async recordSuccess(provider) {
    const key = `perf:${provider}`;
    const existing = performanceCache.get(key) || {
      latencySamples: [],
      successes: 0,
      failures: 0,
      lastUpdated: new Date()
    };

    existing.successes += 1;
    existing.lastUpdated = new Date();

    performanceCache.set(key, existing);
    return existing;
  },

  /**
   * Record a failed fax delivery.
   */
  async recordFailure(provider) {
    const key = `perf:${provider}`;
    const existing = performanceCache.get(key) || {
      latencySamples: [],
      successes: 0,
      failures: 0,
      lastUpdated: new Date()
    };

    existing.failures += 1;
    existing.lastUpdated = new Date();

    performanceCache.set(key, existing);

    await audit.logEvent({
      type: "provider",
      action: "provider_performance_failure",
      provider,
      details: existing
    });

    return existing;
  },

  /**
   * Compute performance score for each provider.
   */
  async getPerformanceScores() {
    const keys = performanceCache.keys();
    const scores = {};

    for (const key of keys) {
      if (!key.startsWith("perf:")) continue;

      const provider = key.replace("perf:", "");
      const data = performanceCache.get(key);

      const avgLatency =
        data.latencySamples.length > 0
          ? data.latencySamples.reduce((a, b) => a + b, 0) /
            data.latencySamples.length
          : 500;

      const total = data.successes + data.failures;
      const successRate = total > 0 ? data.successes / total : 0.95;

      scores[provider] = {
        avgLatencyMs: avgLatency,
        successRate,
        costScore: 1.0 // overridden by providerRoutingRules
      };
    }

    return scores;
  },

  /**
   * Dashboard-friendly summary.
   */
  async getPerformanceSummary() {
    const keys = performanceCache.keys();

    return keys
      .filter((k) => k.startsWith("perf:"))
      .map((k) => {
        const provider = k.replace("perf:", "");
        const data = performanceCache.get(k);

        const avgLatency =
          data.latencySamples.length > 0
            ? data.latencySamples.reduce((a, b) => a + b, 0) /
              data.latencySamples.length
            : 500;

        const total = data.successes + data.failures;
        const successRate = total > 0 ? data.successes / total : 0.95;

        return {
          provider,
          avgLatency,
          successes: data.successes,
          failures: data.failures,
          successRate,
          lastUpdated: data.lastUpdated
        };
      });
  }
};

module.exports = providerPerformanceService;
