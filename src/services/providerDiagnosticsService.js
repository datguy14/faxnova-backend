// src/services/providerDiagnosticsService.js

const providerRoutingEngine = require("./providerRoutingEngine");
const providerHealthService = require("./providerHealthService");
const providerPerformanceService = require("./providerPerformanceService");
const providerLatencyTracker = require("./providerLatencyTracker");
const providerOutageService = require("./providerOutageService");

// Optional: expose breaker state if needed
let breakerState = {
  sinch: "closed",
  telnyx: "closed",
};

function setBreakerState(provider, state) {
  breakerState[provider] = state;
}

module.exports = {
  // ---------------------------------------------------------
  // Unified provider diagnostic snapshot
  // ---------------------------------------------------------
  async getDiagnostics(provider) {
    const health = providerHealthService.getHealth(provider);
    const score = providerPerformanceService.getScore(provider);
    const latency = await providerLatencyTracker.getLatency(provider);
    const outage = await providerOutageService.isOutage(provider);

    // Sovereignty routing weight (score + health modifiers)
    const routingWeight = await providerRoutingEngine.getProviderWeight(provider);

    return {
      provider,
      health,
      score,
      latency,
      outage,
      routingWeight,
      circuitBreaker: breakerState[provider] || "unknown",
      timestamp: new Date(),
    };
  },

  // ---------------------------------------------------------
  // Expose breaker state updates
  // Called by providerCircuitBreaker.js
  // ---------------------------------------------------------
  setBreakerState,
};
