// src/services/providerHealthService.js — STRICT-MODE FINAL

const redis = require("../lib/redis");
const providerOutageService = require("./providerOutageService");
const providerPerformanceService = require("./providerPerformanceService");
const providerLatencyTracker = require("./providerLatencyTracker");

const KEY = "faxnova:providerHealth";
const PROVIDERS = ["sinch", "telnyx"];

const STATES = {
  HEALTHY: "healthy",
  DEGRADED: "degraded",
  HALF_OPEN: "half_open",
  OPEN: "open",
  PROBATION: "probation",
  NONE: "none"
};

const SCORE_DEGRADED = 40;
const SCORE_OPEN = 20;

const LATENCY_DEGRADED = 2000;
const LATENCY_OPEN = 5000;

module.exports = {
  async getHealth(provider, region = null) {
    const key = `${KEY}:${region || "global"}`;
    const raw = await redis.hget(key, provider);
    return raw || STATES.HEALTHY;
  },

  async evaluate(provider, region = null) {
    const key = `${KEY}:${region || "global"}`;

    const outage = await providerOutageService.getOutageState(provider, region);
    const score = await providerPerformanceService.getScore(provider, region);
    const latency = await providerLatencyTracker.getLatency(provider, region);

    let state = STATES.HEALTHY;

    // Outage overrides everything
    if (outage.outageState === STATES.OPEN) {
      state = STATES.OPEN;
    } else if (outage.outageState === STATES.HALF_OPEN) {
      state = STATES.HALF_OPEN;
    } else if (outage.outageState === STATES.PROBATION) {
      state = STATES.PROBATION;
    } else {
      // Score-based health
      if (score < SCORE_OPEN) {
        state = STATES.OPEN;
      } else if (score < SCORE_DEGRADED) {
        state = STATES.DEGRADED;
      }

      // Latency-based health
      if (latency > LATENCY_OPEN) {
        state = STATES.OPEN;
      } else if (latency > LATENCY_DEGRADED) {
        state = STATES.DEGRADED;
      }
    }

    await redis.hset(key, provider, state);
    return state;
  },

  async getAllHealth(region = null) {
    const key = `${KEY}:${region || "global"}`;
    const results = {};

    for (const provider of PROVIDERS) {
      results[provider] = await this.getHealth(provider, region);
    }

    return results;
  }
};
