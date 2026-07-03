// src/services/providerOutageService.js

const redis = require("../lib/redis");

const KEY = "faxnova:providerOutageState";
const PROVIDERS = ["sinch", "telnyx"];

// Circuit breaker timings
const FAILURE_THRESHOLD = 5;          // failures before OPEN
const COOLDOWN_MS = 60_000;           // 1 minute cooldown before HALF_OPEN
const PROBATION_MS = 30_000;          // 30 seconds probation before HEALTHY

module.exports = {
  async getOutageState(provider) {
    const raw = await redis.hget(KEY, provider);
    if (!raw) return "healthy";

    const state = JSON.parse(raw);
    return state.outageState || "healthy";
  },

  async getDiagnostics(provider) {
    const raw = await redis.hget(KEY, provider);
    if (!raw) {
      return {
        outageState: "healthy",
        failures: 0,
        lastFailureAt: null,
        openedAt: null,
        cooldownUntil: null,
        probationUntil: null,
        cooldownRemaining: 0,
        probationRemaining: 0
      };
    }

    const state = JSON.parse(raw);
    const now = Date.now();

    return {
      outageState: state.outageState,
      failures: state.failures || 0,
      lastFailureAt: state.lastFailureAt || null,
      openedAt: state.openedAt || null,
      cooldownUntil: state.cooldownUntil || null,
      probationUntil: state.probationUntil || null,
      cooldownRemaining: state.cooldownUntil
        ? Math.max(0, state.cooldownUntil - now)
        : 0,
      probationRemaining: state.probationUntil
        ? Math.max(0, state.probationUntil - now)
        : 0
    };
  },

  async recordFailure(provider) {
    const raw = await redis.hget(KEY, provider);
    const now = Date.now();

    let state = raw
      ? JSON.parse(raw)
      : {
          outageState: "healthy",
          failures: 0,
          lastFailureAt: null,
          openedAt: null,
          cooldownUntil: null,
          probationUntil: null
        };

    state.failures += 1;
    state.lastFailureAt = now;

    // Already OPEN → stay OPEN
    if (state.outageState === "open") {
      await redis.hset(KEY, provider, JSON.stringify(state));
      return state;
    }

    // HALF_OPEN failure → go back to OPEN
    if (state.outageState === "half_open") {
      state.outageState = "open";
      state.openedAt = now;
      state.cooldownUntil = now + COOLDOWN_MS;
      state.probationUntil = null;
      await redis.hset(KEY, provider, JSON.stringify(state));
      return state;
    }

    // HEALTHY or DEGRADED → threshold exceeded → OPEN
    if (state.failures >= FAILURE_THRESHOLD) {
      state.outageState = "open";
      state.openedAt = now;
      state.cooldownUntil = now + COOLDOWN_MS;
      state.probationUntil = null;
    } else {
      // Otherwise degraded
      state.outageState = "degraded";
    }

    await redis.hset(KEY, provider, JSON.stringify(state));
    return state;
  },

  async recordSuccess(provider) {
    const raw = await redis.hget(KEY, provider);
    const now = Date.now();

    let state = raw
      ? JSON.parse(raw)
      : {
          outageState: "healthy",
          failures: 0,
          lastFailureAt: null,
          openedAt: null,
          cooldownUntil: null,
          probationUntil: null
        };

    // HEALTHY → reset failures
    if (state.outageState === "healthy") {
      state.failures = 0;
      await redis.hset(KEY, provider, JSON.stringify(state));
      return state;
    }

    // OPEN → check cooldown
    if (state.outageState === "open") {
      const cooldownPassed = now > state.cooldownUntil;

      if (cooldownPassed) {
        state.outageState = "half_open";
        state.probationUntil = now + PROBATION_MS;
        state.failures = 0;
      }

      await redis.hset(KEY, provider, JSON.stringify(state));
      return state;
    }

    // HALF_OPEN → success during probation → HEALTHY
    if (state.outageState === "half_open") {
      const probationPassed = now > state.probationUntil;

      if (probationPassed) {
        state.outageState = "healthy";
        state.failures = 0;
        state.openedAt = null;
        state.cooldownUntil = null;
        state.probationUntil = null;
      }

      await redis.hset(KEY, provider, JSON.stringify(state));
      return state;
    }

    // DEGRADED → success moves toward healthy
    if (state.outageState === "degraded") {
      state.failures = 0;
      state.outageState = "healthy";
      await redis.hset(KEY, provider, JSON.stringify(state));
      return state;
    }

    await redis.hset(KEY, provider, JSON.stringify(state));
    return state;
  }
};
