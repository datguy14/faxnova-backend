// src/services/providerOutageService.js

/**
 * Provider Outage / Circuit Breaker Service (FaxNova v1)
 *
 * States:
 * - CLOSED: provider healthy
 * - OPEN: provider blocked (too many failures)
 * - HALF_OPEN: probation mode after cooldown
 */

const FaxNovaError = require("../errors/FaxNovaError");

// In-memory outage state (Redis-ready)
const outages = {
  sinch: {
    state: "closed",
    failures: 0,
    lastFailureAt: null,
    openedAt: null
  },
  telnyx: {
    state: "closed",
    failures: 0,
    lastFailureAt: null,
    openedAt: null
  }
};

// Configurable thresholds
const FAILURE_THRESHOLD = 3;          // failures before OPEN
const COOLDOWN_MS = 15 * 60 * 1000;   // 15 minutes

/**
 * Record provider failure
 */
async function recordFailure(provider) {
  const p = outages[provider];
  if (!p) {
    throw new FaxNovaError("Unknown provider for outage tracking", {
      code: "OUTAGE_PROVIDER_UNKNOWN",
      provider
    });
  }

  p.failures += 1;
  p.lastFailureAt = new Date();

  // OPEN circuit if threshold exceeded
  if (p.failures >= FAILURE_THRESHOLD && p.state !== "open") {
    p.state = "open";
    p.openedAt = new Date();
  }
}

/**
 * Auto-transition OPEN → HALF_OPEN after cooldown
 */
function evaluateState(provider) {
  const p = outages[provider];
  if (!p || p.state !== "open") return;

  const now = Date.now();
  const opened = p.openedAt?.getTime() || 0;

  if (now - opened >= COOLDOWN_MS) {
    p.state = "half-open";
    p.failures = 0; // reset failure counter for probation
  }
}

/**
 * Record provider success
 * - If HALF_OPEN → CLOSED
 */
async function recordSuccess(provider) {
  const p = outages[provider];
  if (!p) {
    throw new FaxNovaError("Unknown provider for outage tracking", {
      code: "OUTAGE_PROVIDER_UNKNOWN",
      provider
    });
  }

  // HALF_OPEN → CLOSED (provider recovered)
  if (p.state === "half-open") {
    p.state = "closed";
    p.failures = 0;
    p.openedAt = null;
  }
}

/**
 * Get outage states (with auto-evaluation)
 */
async function getOutageStates() {
  evaluateState("sinch");
  evaluateState("telnyx");

  return outages;
}

module.exports = {
  recordFailure,
  recordSuccess,
  getOutageStates
};
