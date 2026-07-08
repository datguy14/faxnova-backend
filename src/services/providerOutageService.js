// src/services/providerOutageService.js
// Strict‑Mode Provider Outage Tracking (Redis-Persistent)

const { connection: redis } = require("../lib/redis");

/**
 * Redis keys:
 *   outage:telnyx
 *   outage:sinch
 *
 * Stored shape:
 * {
 *   active: boolean,
 *   lastFailure: number,
 *   lastRecovery: number,
 *   failures: number,
 *   recoveries: number
 * }
 */

async function getOutage(provider) {
  const key = `outage:${provider}`;
  const raw = await redis.get(key);

  if (!raw) {
    return {
      provider,
      active: false,
      lastFailure: null,
      lastRecovery: null,
      failures: 0,
      recoveries: 0
    };
  }

  return JSON.parse(raw);
}

async function markFailure(provider) {
  const key = `outage:${provider}`;
  const now = Date.now();

  const current = await getOutage(provider);

  const updated = {
    provider,
    active: true,
    lastFailure: now,
    lastRecovery: current.lastRecovery,
    failures: current.failures + 1,
    recoveries: current.recoveries
  };

  await redis.set(key, JSON.stringify(updated));
  return updated;
}

async function markRecovery(provider) {
  const key = `outage:${provider}`;
  const now = Date.now();

  const current = await getOutage(provider);

  const updated = {
    provider,
    active: false,
    lastFailure: current.lastFailure,
    lastRecovery: now,
    failures: current.failures,
    recoveries: current.recoveries + 1
  };

  await redis.set(key, JSON.stringify(updated));
  return updated;
}

async function isOutage(provider) {
  const current = await getOutage(provider);
  return current.active === true;
}

module.exports = {
  getOutage,
  markFailure,
  markRecovery,
  isOutage
};
