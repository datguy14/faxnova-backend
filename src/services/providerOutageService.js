// src/services/providerOutageService.js

const NodeCache = require("node-cache");
const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../audit/auditService");

/**
 * Outage scoring model (Routing Engine v2)
 *
 * - 100 = no outage
 * - 0   = provider fully down
 *
 * Failures increase outage severity.
 * Outages auto‑clear after COOLDOWN_MINUTES.
 */

const FAILURE_THRESHOLD = 3;       // failures before marking outage
const COOLDOWN_MINUTES = 15;       // outage auto-clears after this time

// Cache structure:
// outage:{provider} = { failures: number, lastFailure: timestamp }
const outageCache = new NodeCache({
  stdTTL: COOLDOWN_MINUTES * 60,
  checkperiod: 60
});

/**
 * Record a provider failure.
 * If failures exceed threshold → mark outage.
 */
async function recordFailure(provider) {
  if (!["sinch", "telnyx"].includes(provider)) {
    throw new FaxNovaError("Invalid provider for outage tracking", {
      code: "OUTAGE_PROVIDER_INVALID",
      provider
    });
  }

  const key = `outage:${provider}`;
  const existing = outageCache.get(key) || { failures: 0, lastFailure: null };

  const updated = {
    failures: existing.failures + 1,
    lastFailure: new Date()
  };

  outageCache.set(key, updated);

  // If threshold exceeded → mark outage
  if (updated.failures >= FAILURE_THRESHOLD) {
    audit.logEvent({
      tenantId: null, // system-level event
      type: "provider_outage",
      action: "triggered",
      details: {
        provider,
        failures: updated.failures
      }
    });
  }

  return updated;
}

/**
 * Returns list of providers currently in outage.
 */
function getActiveOutages() {
  const keys = outageCache.keys();
  return keys
    .filter((k) => k.startsWith("outage:"))
    .map((k) => k.replace("outage:", ""));
}

/**
 * Returns detailed outage info for dashboards.
 */
function getOutageSummary() {
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
  outageCache.del(`outage:${provider}`);

  audit.logEvent({
    tenantId: null,
    type: "provider_outage",
    action: "cleared",
    details: { provider }
  });

  return true;
}

/**
 * Outage score (0–100)
 *
 * - If provider is in outage → score = 0
 * - Otherwise → score = 100
 *
 * Routing Engine v2 uses this score.
 */
function getOutageScore(provider) {
  const key = `outage:${provider}`;
  const data = outageCache.get(key);

  if (!data) {
    return 100; // no outage
  }

  // Outage severity based on failure count
  const severity = Math.min(data.failures / FAILURE_THRESHOLD, 1);

  return Math.round(100 * (1 - severity)); // 0–100
}

module.exports = {
  recordFailure,
  getActiveOutages,
  getOutageSummary,
  clearOutage,
  getOutageScore
};
