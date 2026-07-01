// src/services/providerOutageService.js

const redis = require("../lib/redis");

const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 15 * 60 * 1000;      // outage window
const PROBATION_MS = 2 * 60 * 1000;      // half-open window

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
      await redis.hset(k, "probationUntil", Date.now() + COOLDOWN_MS);

      // TTL triggers half-open transition
      await redis.pexpire(k, COOLDOWN_MS);
    }
  },

  async recordSuccess(provider) {
    const k = key(provider);
    const state = await redis.hget(k, "state");

    if (state === "half-open") {
      const probationUntil = Number(await redis.hget(k, "probationUntil"));

      if (Date.now() >= probationUntil) {
        await redis.hset(k, "state", "closed");
        await redis.hset(k, "failures", 0);
        await redis.hdel(k, "openedAt");
      }
    }
  },

  async getOutageState(provider) {
    const k = key(provider);

    const state = await redis.hget(k, "state");
    const ttl = await redis.pttl(k);

    if (!state) return "closed";

    if (state === "open" && ttl <= 0) {
      await redis.hset(k, "state", "half-open");
      await redis.hset(k, "probationUntil", Date.now() + PROBATION_MS);
      await redis.hset(k, "failures", 0);
      return "half-open";
    }

    return state;
  },

  async isOutage(provider) {
    return (await this.getOutageState(provider)) === "open";
  },

  async getDiagnostics(provider) {
    const k = key(provider);
    const data = await redis.hgetall(k);

    return {
      provider,
      outageState: await this.getOutageState(provider),
      failures: Number(data.failures || 0),
      lastFailureAt: Number(data.lastFailureAt || 0),
      openedAt: Number(data.openedAt || 0),
      probationUntil: Number(data.probationUntil || 0),
    };
  }
};
