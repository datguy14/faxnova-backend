// src/services/providerPerformanceService.js

const NodeCache = require("node-cache");
const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../utils/auditLogger");

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

module.exports = {
  /**
   * Record latency for a provider.
   */
  async recordLatency(provider, ms) {
    try {
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
    } catch (err) {
      throw new FaxNovaError("Failed to record provider latency", {
        provider,
        code: "PERFORMANCE_LATENCY_ERROR",
        details: err.message
      });
    }
  },

  /**
   * Record a successful fax delivery.
   */
  async recordSuccess(provider) {
    try {
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
    } catch (err) {
      throw new FaxNovaError("Failed to record provider success", {
        provider,
        code: "PERFORMANCE_SUCCESS_ERROR",
        details: err.message
      });
    }
  },

  /**
   * Record a failed fax delivery.
   */
  async recordFailure(provider) {
    try {
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

      audit.log("provider_failure_recorded", {
        provider,
        failures: existing.failures
      });

      return existing;
    } catch (err) {
      throw new FaxNovaError("Failed to record provider failure", {
        provider,
        code: "PERFORMANCE_FAILURE_ERROR",
        details: err.message
      });
    }
  },

  /**
   * Compute performance score for each provider.
   */
  async getPerformance() {
    try {
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
          latency: avgLatency,
          successRate,
          cost: 1.0 // cost overridden by routing rules
        };
      }

      return scores;
    } catch (err) {
      throw new FaxNovaError("Failed to compute provider performance", {
        code: "PERFORMANCE_COMPUTE_ERROR",
        details: err.message
      });
    }
  },

  /**
   * Dashboard-friendly summary.
   */
  async getPerformanceSummary() {
    try {
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
    } catch (err) {
      throw new FaxNovaError("Failed to generate performance summary", {
        code: "PERFORMANCE_SUMMARY_ERROR",
        details: err.message
      });
    }
  }
};
