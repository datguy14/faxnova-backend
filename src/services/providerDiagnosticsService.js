// src/services/providerDiagnosticsService.js

const providerOutageService = require("./providerOutageService");
const providerHealthService = require("./providerHealthService");
const providerPerformanceService = require("./providerPerformanceService");
const providerLatencyTracker = require("./providerLatencyTracker");

const PROVIDERS = ["sinch", "telnyx"];

module.exports = {
  async getProviderDiagnostics(provider) {
    const outageState = await providerOutageService.getOutageState(provider);
    const health = await providerHealthService.getHealth(provider);
    const score = await providerPerformanceService.getScore(provider);
    const latency = await providerLatencyTracker.getLatency(provider);

    const outageDetails = await providerOutageService.getDiagnostics(provider);

    return {
      provider,
      health,
      outageState,
      score,
      latency,
      failures: outageDetails.failures,
      lastFailureAt: outageDetails.lastFailureAt,
      openedAt: outageDetails.openedAt,
      probationUntil: outageDetails.probationUntil,
      cooldownRemaining: outageDetails.cooldownRemaining,
      probationRemaining: outageDetails.probationRemaining
    };
  },

  async getAllDiagnostics() {
    const results = [];

    for (const provider of PROVIDERS) {
      results.push(await this.getProviderDiagnostics(provider));
    }

    return results;
  }
};
