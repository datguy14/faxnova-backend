// src/services/providerHealthService.js

const redis = require("../lib/redis");
const providerOutageService = require("./providerOutageService");
const providerPerformanceService = require("./providerPerformanceService");
const providerLatencyTracker = require("./providerLatencyTracker");

const KEY = "faxnova:providerHealth";
const PROVIDERS = ["sinch", "telnyx"];

// Unified strict‑mode health states
const STATES = {
  HEALTHY: "healthy",
  DEGRADED: "degraded",
  HALF_OPEN: "half_open",
  OPEN: "open",
  PROBATION: "probation"
};

// Thresholds
const SCORE_DEGRADED = 40;
const SCORE_OPEN = 20;

const LATENCY_DEGRADED = 2000;
const LATENCY_OPEN = 5000;

module.exports = {
  async getHealth(provider) {
    const raw = await redis.hget(KEY, provider);
    return raw || STATES.HEALTHY;
  },

  async evaluate(provider) {
    const outageState = await providerOutageService.getOutageState(provider);
    const score = await providerPerformanceService.getScore(provider);
    const latency = await providerLatencyTracker.getLatency(provider);

    let state = STATES.HEALTHY;

    // Outage overrides everything
    if (outageState === STATES.OPEN) {
      state = STATES.OPEN;
    } else if (outageState === STATES.HALF_OPEN) {
      state = STATES.HALF_OPEN;
    } else if (outageState === STATES.PROBATION) {
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

    await redis.hset(KEY, provider, state);
    return state;
  },

  async getAllHealth() {
    const results = {};
    for (const provider of PROVIDERS) {
      results[provider] = await this.getHealth(provider);
    }
    return results;
  }
};
