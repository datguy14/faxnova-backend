// src/services/providerHealthService.js

const providerLatencyTracker = require("./providerLatencyTracker");
const providerPerformanceService = require("./providerPerformanceService");
const providerOutageService = require("./providerOutageService");

const providerHealth = {
  sinch: "healthy",
  telnyx: "healthy",
};

module.exports = {
  async evaluate(provider) {
    const latencyInfo = await providerLatencyTracker.getLatency(provider);
    const latencyValue = latencyInfo.value;
    const errorRate = providerPerformanceService.getErrorRate(provider);
    const outageState = await providerOutageService.getOutageState(provider);

    // Outage → provider is DOWN
    if (outageState === "open") {
      providerHealth[provider] = "down";
      return "down";
    }

    // HALF-OPEN → degraded probation
    if (outageState === "half-open") {
      providerHealth[provider] = "degraded";
      return "degraded";
    }

    // Latency anomaly detection
    const latencySpike =
      latencyInfo.p99 > 8000 ||
      latencyInfo.ewma > 5000 ||
      latencyValue > 6000;

    // Error rate anomaly detection
    const errorSpike = errorRate > 0.25;

    if (latencySpike || errorSpike) {
      providerHealth[provider] = "degraded";
    } else {
      providerHealth[provider] = "healthy";
    }

    return providerHealth[provider];
  },

  setHealth(provider, state) {
    providerHealth[provider] = state;
  },

  getHealth(provider) {
    return providerHealth[provider];
  },

  getAllHealth() {
    return { ...providerHealth };
  }
};
