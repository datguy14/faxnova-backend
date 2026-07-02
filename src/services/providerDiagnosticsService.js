// src/services/providerDiagnosticsService.js

const providerHealthService = require("./providerHealthService");
const providerOutageService = require("./providerOutageService");
const providerPerformanceService = require("./providerPerformanceService");
const providerLatencyTracker = require("./providerLatencyTracker");

// Static provider capabilities
const STATIC_CAPABILITIES = {
  sinch: {
    canSend: true,
    canReceive: false,
    supportsPdf: true,
    supportsTiff: true,
    supportsWebhook: true,
    residency: { US: true, CA: true, EU: true }
  },
  telnyx: {
    canSend: true,
    canReceive: true,
    supportsPdf: true,
    supportsTiff: true,
    supportsWebhook: true,
    residency: { US: true, CA: true, EU: true }
  }
};

module.exports = {
  getStaticCapabilities(provider) {
    return STATIC_CAPABILITIES[provider] || {};
  },

  async getDiagnostics(provider) {
    const staticCaps = this.getStaticCapabilities(provider);

    const health = await providerHealthService.getHealth(provider);
    const outageState = await providerOutageService.getOutageState(provider);
    const circuitBreaker = await providerOutageService.getCircuitBreakerState(provider);

    const latency = await providerLatencyTracker.getLatency(provider);
    const latencyDetails = await providerLatencyTracker.getLatencyDetails(provider);

    const score = await providerPerformanceService.getScore(provider);
    const errorRate = await providerPerformanceService.getErrorRate(provider);
    const successRate = await providerPerformanceService.getSuccessRate(provider);

    const routingWeight = this.calculateRoutingWeight({
      health,
      outageState,
      latency,
      score,
      staticCaps
    });

    return {
      provider,
      ...staticCaps,
      health,
      outageState,
      latency,
      latencyDetails,
      score,
      errorRate,
      successRate,
      routingWeight,
      circuitBreaker,
      timestamp: Date.now()
    };
  },

  calculateRoutingWeight({ health, outageState, latency, score, staticCaps }) {
    if (!staticCaps.canSend) return 0;
    if (outageState === "open") return 0;
    if (health === "down") return 0;

    let weight = score;

    if (health === "degraded") weight *= 0.7;
    if (outageState === "half-open") weight *= 0.5;

    if (latency > 2000) weight *= 0.6;
    if (latency > 5000) weight *= 0.3;

    return weight;
  }
};
