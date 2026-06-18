// src/services/providerOutageService.js
import NodeCache from "node-cache";
import { auditService } from "../audit/auditService.js";

/**
 * Provider Outage Service
 * -----------------------
 * Tracks provider failures and marks providers as "in outage"
 * when they exceed a failure threshold.
 *
 * Outages automatically expire after a cooldown period.
 */

const FAILURE_THRESHOLD = 3;       // failures before marking outage
const COOLDOWN_MINUTES = 15;       // outage auto-clears after this time

// Cache structure:
// outage:{provider} = { failures: number, lastFailure: timestamp }
const outageCache = new NodeCache({
  stdTTL: COOLDOWN_MINUTES * 60,
  checkperiod: 60
});

export const providerOutageService = {
  /**
   * Record a provider failure.
   * If failures exceed threshold → mark outage.
   */
  async recordFailure(provider) {
    const key = `outage:${provider}`;
    const existing = outageCache.get(key) || { failures: 0, lastFailure: null };

    const updated = {
      failures: existing.failures + 1,
      lastFailure: new Date()
    };

    outageCache.set(key, updated);

    // If threshold exceeded → mark outage
    if (updated.failures >= FAILURE_THRESHOLD) {
      await auditService.log({
        action: "PROVIDER_OUTAGE_TRIGGERED",
        provider,
        details: updated
      });
    }

    return updated;
  },

  /**
   * Returns list of providers currently in outage.
   */
  async getActiveOutages() {
    const keys = outageCache.keys();
    const outages = keys
      .filter((k) => k.startsWith("outage:"))
      .map((k) => k.replace("outage:", ""));

    return outages;
  },

  /**
   * Returns detailed outage info for dashboards.
   */
  async getOutageSummary() {
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
  },

  /**
   * Clear outage for a provider (manual reset).
   */
  async clearOutage(provider) {
    outageCache.del(`outage:${provider}`);

    await auditService.log({
      action: "PROVIDER_OUTAGE_CLEARED",
      provider
    });

    return true;
  }
};
