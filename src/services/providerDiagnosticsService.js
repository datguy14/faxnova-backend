// src/services/providerDiagnosticsService.js

const providerRoutingEngine = require("./providerRoutingEngine");
const providerHealthService = require("./providerHealthService");
const providerPerformanceService = require("./providerPerformanceService");
const providerLatencyTracker = require("./providerLatencyTracker");
const providerOutageService = require("./providerOutageService");

let breakerState = {
  sinch: "closed",
  telnyx: "closed",
};

function setBreakerState(provider, state) {
  breakerState[provider] = state;
}

module.exports = {
  async getDiagnostics(provider) {
    const health = providerHealthService.getHealth(provider);
    const score = providerPerformanceService.getScore(provider);
    const errorRate = providerPerformanceService.getErrorRate(provider);

    const latencyInfo = await providerLatencyTracker.getLatency(provider);
    const latency = latencyInfo.value;

    const outageState = await providerOutageService.getOutageState(provider);

    const routingWeight = await providerRoutingEngine.getProviderWeight(provider);

    return {
      provider,
      health,
      score,
      errorRate,
      latency,
      latencyDetails: latencyInfo,
      outageState,
      routingWeight,
      circuitBreaker: breakerState[provider] || "unknown",
      timestamp: new Date(),
    };
  },

  setBreakerState,
};
