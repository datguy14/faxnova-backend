// src/services/providerOutageService.js

const NodeCache = require("node-cache");
const audit = require("../audit/auditService");
const FaxNovaError = require("../errors/FaxNovaError");

/**
 * Provider Outage Service (FaxNova v1)
 *
 * Responsibilities:
 * - Track provider failures
 * - Mark provider as "in outage" after threshold
 * - Auto-clear outage after cooldown
 * - Provide outage list for Routing Engine v2
 */

const FAILURE_THRESHOLD = 3;       // failures before outage
const COOLDOWN_MINUTES = 15;       // outage auto-clears after this time

// Cache structure:
// outage:{provider} = { failures, lastFailure }
const outageCache = new NodeCache({
  stdTTL: COOLDOWN_MINUTES * 60,
  checkperiod: 60
});

/**
 * Record a provider failure.
 * If failures exceed threshold → mark outage.
 */
async function recordFailure(provider) {
  try {
    const key = `outage:${provider}`;
    const existing = outageCache.get(key) || { failures: 0, lastFailure: null };

    const updated = {
      failures: existing.failures + 1,
      lastFailure: new Date()
    };

    outageCache.set(key, updated);

    // Threshold exceeded → outage triggered
    if (updated.failures >= FAILURE_THRESHOLD) {
      await audit.logEvent({
        type: "provider_outage",
        action: "triggered",
        details: {
          provider,
          failures: updated.failures,
          lastFailure: updated.lastFailure
        }
      });
    }

    return updated;
  } catch (err) {
    throw new FaxNovaError("Failed to record provider failure", {
      code: "OUTAGE_RECORD_FAILED",
      details: err.message
    });
  }
}

/**
 * Returns list of providers currently in outage.
 */
async function getActiveOutages() {
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
}

/**
 * Clear outage for a provider (manual reset).
 */
async function clearOutage(provider) {
  try {
    outageCache.del(`outage:${provider}`);

    await audit.logEvent({
      type: "provider_outage",
      action: "cleared",
      details: { provider }
    });

    return true;
  } catch (err) {
    throw new FaxNovaError("Failed to clear provider outage", {
      code: "OUTAGE_CLEAR_FAILED",
      details: err.message
    });
  }
}

module.exports = {
  recordFailure,
  getActiveOutages,
  clearOutage
};
