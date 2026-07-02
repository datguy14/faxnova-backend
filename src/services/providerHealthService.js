// src/services/providerHealthService.js

const redis = require("../lib/redis");
const providerOutageService = require("./providerOutageService");
const providerPerformanceService = require("./providerPerformanceService");
const providerLatencyTracker = require("./providerLatencyTracker");

const KEY = "faxnova:providerHealth";
const PROVIDERS = ["sinch", "telnyx"];

// Health states
const STATES = {
  HEALTHY: "healthy",
  DEGRADED: "degraded",
  HALF_OPEN: "half-open",
  DOWN: "down"
};

// Thresholds
const SCORE_DEGRADED = 40;
const SCORE_DOWN = 20;

const LATENCY_DEGRADED = 2000;
const LATENCY_DOWN = 5000;

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
    if (outageState === "open") {
      state = STATES.DOWN;
    } else if (outageState === "half-open") {
      state = STATES.HALF_OPEN;
    } else {
      // Score-based health
      if (score < SCORE_DOWN) {
        state = STATES.DOWN;
      } else if (score < SCORE_DEGRADED) {
        state = STATES.DEGRADED;
      }

      // Latency-based health
      if (latency > LATENCY_DOWN) {
        state = STATES.DOWN;
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
