// src/services/providerOutageService.js

const redis = require("../lib/redis");

const FAILURE_THRESHOLD = 3;
const OPEN_DURATION_MS = 15 * 60 * 1000;     // 15 minutes
const HALF_OPEN_DURATION_MS = 2 * 60 * 1000; // 2 minutes

function key(provider) {
  return `outage:${provider}`;
}

module.exports = {
  async recordFailure(provider) {
    const k = key(provider);

    const failures = await redis.hincrby(k, "failures", 1);
    await redis.hset(k, "lastFailureAt", Date.now());

    const state = await redis.hget(k, "state");

    if (failures >= FAILURE_THRESHOLD && state !== "open") {
      await redis.hset(k, "state", "open");
      await redis.hset(k, "openedAt", Date.now());
      await redis.hset(k, "halfOpenAt", Date.now() + OPEN_DURATION_MS);
    }
  },

  async recordSuccess(provider) {
    const k = key(provider);
    const state = await redis.hget(k, "state");

    if (state === "half-open") {
      const halfOpenAt = Number(await redis.hget(k, "halfOpenAt"));

      if (Date.now() >= halfOpenAt) {
        await redis.hset(k, "state", "closed");
        await redis.hset(k, "failures", 0);
        await redis.hdel(k, "openedAt");
        await redis.hdel(k, "halfOpenAt");
      }
    }
  },

  async getOutageState(provider) {
    const k = key(provider);

    const state = await redis.hget(k, "state");
    if (!state) return "closed";

    if (state === "open") {
      const openedAt = Number(await redis.hget(k, "openedAt"));
      if (Date.now() - openedAt >= OPEN_DURATION_MS) {
        await redis.hset(k, "state", "half-open");
        await redis.hset(k, "halfOpenAt", Date.now() + HALF_OPEN_DURATION_MS);
        return "half-open";
      }
    }

    return state;
  },

  async getCircuitBreakerState(provider) {
    return this.getOutageState(provider);
  },

  async getDiagnostics(provider) {
    const k = key(provider);
    const data = await redis.hgetall(k);

    const state = await this.getOutageState(provider);

    return {
      provider,
      outageState: state,
      failures: Number(data.failures || 0),
      lastFailureAt: Number(data.lastFailureAt || 0),
      openedAt: Number(data.openedAt || 0),
      halfOpenAt: Number(data.halfOpenAt || 0),
      cooldownRemaining:
        state === "open"
          ? Math.max(0, OPEN_DURATION_MS - (Date.now() - Number(data.openedAt || 0)))
          : 0,
      probationRemaining:
        state === "half-open"
          ? Math.max(0, Number(data.halfOpenAt || 0) - Date.now())
          : 0
    };
  }
};
