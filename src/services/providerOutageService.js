// src/services/providerOutageService.js

const NodeCache = require("node-cache");
const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../utils/auditLogger");

/**
 * Provider Outage Engine v1
 *
 * Tracks:
 * - consecutive failures
 * - outage activation
 * - outage cooldown expiration
 *
 * Outages auto-clear after TTL.
 */

const FAILURE_THRESHOLD = 3;       // failures before marking outage
const COOLDOWN_MINUTES = 15;       // outage auto-clears after this time

// Cache structure:
// outage:{provider} = { failures: number, lastFailure: timestamp }
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
      const existing = outageCache.get(key) || { failures: 0, lastFailure: null };

      const updated = {
        failures: existing.failures + 1,
        lastFailure: new Date()
      };

      outageCache.set(key, updated);

      // If threshold exceeded → mark outage
      if (updated.failures >= FAILURE_THRESHOLD) {
        audit.error("provider_outage_triggered", {
          provider,
          failures: updated.failures
        });
      }

      return updated;
    } catch (err) {
      throw new FaxNovaError("Failed to record provider outage", {
        code: "OUTAGE_RECORD_ERROR",
        provider,
        details: err.message
      });
    }
  },

  /**
   * Returns outage status for all providers.
   *
   * {
   *   sinch: { active: true/false, failures, lastFailure, expiresInSeconds }
   *   telnyx: { ... }
   * }
   */
  async getOutages() {
    try {
      const providers = ["sinch", "telnyx"];
      const result = {};

      for (const p of providers) {
        const key = `outage:${p}`;
        const data = outageCache.get(key);

        if (!data) {
          result[p] = {
            active: false,
            failures: 0,
            lastFailure: null,
            expiresInSeconds: 0
          };
          continue;
        }

        const ttl = outageCache.getTtl(key);
        const expiresInSeconds = ttl ? Math.floor((ttl - Date.now()) / 1000) : 0;

        result[p] = {
          active: true,
          failures: data.failures,
          lastFailure: data.lastFailure,
          expiresInSeconds
        };
      }

      return result;
    } catch (err) {
      throw new FaxNovaError("Failed to load provider outages", {
        code: "OUTAGE_FETCH_ERROR",
        details: err.message
      });
    }
  },

  /**
   * Returns list of providers currently in outage.
   */
  async getActiveOutages() {
    const outages = await this.getOutages();
    return Object.keys(outages).filter((p) => outages[p].active);
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
        code: "OUTAGE_CLEAR_ERROR",
        provider,
        details: err.message
      });
    }
  }
};
