// src/services/providerOutageService.js

const redis = require("../lib/redis");

const KEY = "faxnova:providerOutageState";
const PROVIDERS = ["sinch", "telnyx"];

// Circuit breaker timings
const FAILURE_THRESHOLD = 5;          // failures before OPEN
const COOLDOWN_MS = 60_000;           // 1 minute cooldown before HALF-OPEN
const PROBATION_MS = 30_000;          // 30 seconds probation in HALF-OPEN

module.exports = {
  async getOutageState(provider) {
    const raw = await redis.hget(KEY, provider);
    if (!raw) return "closed";

    const state = JSON.parse(raw);
    return state.state || "closed";
  },

  async getDiagnostics(provider) {
    const raw = await redis.hget(KEY, provider);
    if (!raw) {
      return {
        failures: 0,
        lastFailureAt: null,
        openedAt: null,
        probationUntil: null,
        cooldownRemaining: 0,
        probationRemaining: 0
      };
    }

    const state = JSON.parse(raw);
    const now = Date.now();

    return {
      failures: state.failures || 0,
      lastFailureAt: state.lastFailureAt || null,
      openedAt: state.openedAt || null,
      probationUntil: state.probationUntil || null,
      cooldownRemaining: state.openedAt
        ? Math.max(0, state.openedAt + COOLDOWN_MS - now)
        : 0,
      probationRemaining: state.probationUntil
        ? Math.max(0, state.probationUntil - now)
        : 0
    };
  },

  async recordFailure(provider) {
    const raw = await redis.hget(KEY, provider);
    const now = Date.now();

    let state = raw ? JSON.parse(raw) : {
      state: "closed",
      failures: 0,
      lastFailureAt: null,
      openedAt: null,
      probationUntil: null
    };

    state.failures += 1;
    state.lastFailureAt = now;

    // If provider is already OPEN, keep it open
    if (state.state === "open") {
      await redis.hset(KEY, provider, JSON.stringify(state));
      return state;
    }

    // If provider is HALF-OPEN and fails → go back to OPEN
    if (state.state === "half-open") {
      state.state = "open";
      state.openedAt = now;
      state.probationUntil = null;
      await redis.hset(KEY, provider, JSON.stringify(state));
      return state;
    }

    // CLOSED → check if threshold exceeded
    if (state.failures >= FAILURE_THRESHOLD) {
      state.state = "open";
      state.openedAt = now;
      state.probationUntil = null;
    }

    await redis.hset(KEY, provider, JSON.stringify(state));
    return state;
  },

  async recordSuccess(provider) {
    const raw = await redis.hget(KEY, provider);
    const now = Date.now();

    let state = raw ? JSON.parse(raw) : {
      state: "closed",
      failures: 0,
      lastFailureAt: null,
      openedAt: null,
      probationUntil: null
    };

    // CLOSED → success just resets failures
    if (state.state === "closed") {
      state.failures = 0;
      await redis.hset(KEY, provider, JSON.stringify(state));
      return state;
    }

    // OPEN → check cooldown window
    if (state.state === "open") {
      const cooldownPassed = now > state.openedAt + COOLDOWN_MS;

      if (cooldownPassed) {
        state.state = "half-open";
        state.probationUntil = now + PROBATION_MS;
        state.failures = 0;
      }

      await redis.hset(KEY, provider, JSON.stringify(state));
      return state;
    }

    // HALF-OPEN → success during probation closes the breaker
    if (state.state === "half-open") {
      const probationPassed = now > state.probationUntil;

      if (probationPassed) {
        state.state = "closed";
        state.failures = 0;
        state.openedAt = null;
        state.probationUntil = null;
      }

      await redis.hset(KEY, provider, JSON.stringify(state));
      return state;
    }

    await redis.hset(KEY, provider, JSON.stringify(state));
    return state;
  }
};
