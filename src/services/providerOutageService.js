// src/services/providerOutageService.js

const NodeCache = require("node-cache");
const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../utils/auditLogger");

const FAILURE_THRESHOLD = 3;          // failures before marking outage
const COOLDOWN_MINUTES = 15;          // outage auto-clears after this time

// Cache structure:
// outage:{provider} = {
//   failures: number,
//   lastFailure: timestamp
// }

const outageCache = new NodeCache({
  stdTTL: COOLDOWN_MINUTES * 60,
  checkperiod: 60
});

module.exports = {
  /**
   * Record a provider failure.
   * If failures exceed threshold → mark outage.
   */
  async recordFailure(provider) {
    try {
      const key = `outage:${provider}`;
      const existing = outageCache.get(key) || {
        failures: 0,
        lastFailure: null
      };

      const updated = {
        failures: existing.failures + 1,
        lastFailure: new Date()
      };

      outageCache.set(key, updated);

      // If threshold exceeded → mark outage
      if (updated.failures >= FAILURE_THRESHOLD) {
        audit.log("provider_outage_triggered", {
          provider,
          failures: updated.failures
        });
      }

      return updated;
    } catch (err) {
      throw new FaxNovaError("Failed to record provider failure", {
        provider,
        code: "OUTAGE_RECORD_FAILURE",
        details: err.message
      });
    }
  },

  /**
   * Returns list of providers currently in outage.
   */
  async getActiveOutages() {
    try {
      const keys = outageCache.keys();

      return keys
        .filter((k) => k.startsWith("outage:"))
        .map((k) => k.replace("outage:", ""));
    } catch (err) {
      throw new FaxNovaError("Failed to fetch active outages", {
        code: "OUTAGE_FETCH_ERROR",
        details: err.message
      });
    }
  },

  /**
   * Returns detailed outage info for dashboards.
   */
  async getOutageSummary() {
    try {
      const keys = outageCache.keys();

      return keys
        .filter((k) => k.startsWith("outage:"))
        .map((k) => {
          const provider = k.replace("outage:", "");
          const data = outageCache.get(k);

          return {
            provider,
            failures: data.failures,
            lastFailure: data.lastFailure,
            expiresInSeconds: outageCache.getTtl(k)
              ? Math.floor((outageCache.getTtl(k) - Date.now()) / 1000)
              : 0
          };
        });
    } catch (err) {
      throw new FaxNovaError("Failed to generate outage summary", {
        code: "OUTAGE_SUMMARY_ERROR",
        details: err.message
      });
    }
  },

  /**
   * Clear outage for a provider (manual reset).
   */
  async clearOutage(provider) {
    try {
      outageCache.del(`outage:${provider}`);

      audit.log("provider_outage_cleared", {
        provider
      });

      return true;
    } catch (err) {
      throw new FaxNovaError("Failed to clear provider outage", {
        provider,
        code: "OUTAGE_CLEAR_ERROR",
        details: err.message
      });
    }
  }
};
