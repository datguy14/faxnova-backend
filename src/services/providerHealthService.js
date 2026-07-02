// src/services/providerHealthService.js

const providerOutageService = require("./providerOutageService");
const providerPerformanceService = require("./providerPerformanceService");
const providerLatencyTracker = require("./providerLatencyTracker");

const HEALTH_KEY = "faxnova:providerHealth";

const DEFAULT_HEALTH = {
  sinch: "healthy",
  telnyx: "healthy"
};

module.exports = {
  async getHealth(provider) {
    const stored = await global.redis.hget(HEALTH_KEY, provider);
    return stored || DEFAULT_HEALTH[provider];
  },

  async setHealth(provider, state) {
    await global.redis.hset(HEALTH_KEY, provider, state);
    return state;
  },

  async evaluate(provider) {
    const outageState = await providerOutageService.getOutageState(provider);
    const latency = await providerLatencyTracker.getLatency(provider);
    const errorRate = await providerPerformanceService.getErrorRate(provider);
    const score = await providerPerformanceService.getScore(provider);

    // Outage overrides everything
    if (outageState === "open") {
      return this.setHealth(provider, "down");
    }

    if (outageState === "half-open") {
      return this.setHealth(provider, "half-open");
    }

    // Latency-based degradation
    if (latency > 5000) {
      return this.setHealth(provider, "down");
    }

    if (latency > 2000) {
      return this.setHealth(provider, "degraded");
    }

    // Error-rate-based degradation
    if (errorRate > 0.25) {
      return this.setHealth(provider, "down");
    }

    if (errorRate > 0.10) {
      return this.setHealth(provider, "degraded");
    }

    // Performance score degradation
    if (score < 20) {
      return this.setHealth(provider, "down");
    }

    if (score < 40) {
      return this.setHealth(provider, "degraded");
    }

    // Default
    return this.setHealth(provider, "healthy");
  }
};
