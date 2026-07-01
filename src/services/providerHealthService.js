// src/services/providerHealthService.js

const providerLatencyTracker = require("./providerLatencyTracker");
const providerPerformanceService = require("./providerPerformanceService");

const providerHealth = {
  sinch: "healthy",
  telnyx: "healthy",
};

module.exports = {
  async evaluate(provider) {
    const latency = await providerLatencyTracker.getLatency(provider);
    const errorRate = providerPerformanceService.getErrorRate(provider);

    // Latency anomaly detection
    const latencySpike =
      latency.p99 > 8000 || latency.ewma > 5000;

    // Error rate anomaly detection
    const errorSpike = errorRate > 0.25; // 25% failure rate

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
};
