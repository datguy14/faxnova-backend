// src/services/providerOutageService.js

const redis = require("../lib/redis");
const FaxNovaError = require("../errors/FaxNovaError");

const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 15 * 60 * 1000;

function key(provider) {
  return `outage:${provider}`;
}

module.exports = {
  async recordFailure(provider) {
    const k = key(provider);

    // Increment failure count atomically
    const failures = await redis.hincrby(k, "failures", 1);
    await redis.hset(k, "lastFailureAt", Date.now());

    // If threshold exceeded → OPEN
    const state = await redis.hget(k, "state");
    if (failures >= FAILURE_THRESHOLD && state !== "open") {
      await redis.hset(k, "state", "open");
      await redis.hset(k, "openedAt", Date.now());

      // Set TTL for automatic HALF_OPEN transition
      await redis.pexpire(k, COOLDOWN_MS);
    }
  },

  async recordSuccess(provider) {
    const k = key(provider);
    const state = await redis.hget(k, "state");

    // HALF_OPEN → CLOSED
    if (state === "half-open") {
      await redis.hset(k, "state", "closed");
      await redis.hset(k, "failures", 0);
      await redis.hdel(k, "openedAt");
    }
  },

  async getOutageState(provider) {
    const k = key(provider);

    const state = await redis.hget(k, "state");
    const ttl = await redis.pttl(k);

    if (!state) return "closed";

    // TTL expired → HALF_OPEN
    if (state === "open" && ttl <= 0) {
      await redis.hset(k, "state", "half-open");
      await redis.hset(k, "failures", 0);
      return "half-open";
    }

    return state;
  },

  async isOutage(provider) {
    const state = await this.getOutageState(provider);
    return state === "open";
  },

  async getDiagnostics(provider) {
    const k = key(provider);

    const data = await redis.hgetall(k);
    const state = await this.getOutageState(provider);

    return {
      provider,
      state,
      failures: Number(data.failures || 0),
      lastFailureAt: Number(data.lastFailureAt || 0),
      openedAt: Number(data.openedAt || 0),
    };
  }
};
