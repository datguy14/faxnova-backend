// src/services/providerRoutingEngine.js

const providerHealthService = require("./providerHealthService");
const providerPerformanceService = require("./providerPerformanceService");
const providerLatencyTracker = require("./providerLatencyTracker");
const providerOutageService = require("./providerOutageService");
const providerDiagnosticsService = require("./providerDiagnosticsService");
const providerResidencyEngine = require("./providerResidencyEngine");
const dataResidencyGuard = require("./dataResidencyGuard");

const PROVIDERS = ["sinch", "telnyx"];

module.exports = {
  async selectProviderForFax(fax) {
    const allowedProviders =
      providerResidencyEngine.getAllowedProvidersForFax(fax);

    if (!allowedProviders.length) {
      throw new Error("No providers satisfy residency constraints");
    }

    const scored = [];

    for (const provider of allowedProviders) {
      const health = providerHealthService.getHealth(provider);
      const score = providerPerformanceService.getScore(provider);
      const latency = await providerLatencyTracker.getLatency(provider);
      const outage = await providerOutageService.isOutage(provider);

      if (health === "down" || outage) continue;

      const healthWeight = health === "degraded" ? 0.5 : 1;
      const latencyPenalty = latency > 5000 ? 0.7 : 1;

      const weight = score * healthWeight * latencyPenalty;

      scored.push({ provider, weight });
    }

    if (!scored.length) {
      throw new Error("No available providers after health/outage filtering");
    }

    scored.sort((a, b) => b.weight - a.weight);
    const selected = scored[0].provider;

    // Enforce residency
    dataResidencyGuard.enforceForFax(fax, selected);

    // Attach residency zone + audit log
    fax.residencyZone =
      (fax.sovereigntyConstraints?.region || "us").toLowerCase();

    fax.residencyDecisionLog = fax.residencyDecisionLog || [];
    fax.residencyDecisionLog.push(
      dataResidencyGuard.buildDecisionLogEntry(fax, selected)
    );

    return selected;
  },

  async selectProvider() {
    const fax = { sovereigntyConstraints: {} };
    return this.selectProviderForFax(fax);
  },

  async getProviderWeight(provider) {
    const health = providerHealthService.getHealth(provider);
    const score = providerPerformanceService.getScore(provider);
    const latency = await providerLatencyTracker.getLatency(provider);
    const outage = await providerOutageService.isOutage(provider);

    if (health === "down" || outage) return 0;

    const healthWeight = health === "degraded" ? 0.5 : 1;
    const latencyPenalty = latency > 5000 ? 0.7 : 1;

    return score * healthWeight * latencyPenalty;
  },

  async recordEvent(provider, event) {
    if (event.status === "delivered") {
      providerPerformanceService.applySuccessBoost(provider);
      providerHealthService.setHealth(provider, "healthy");
    }

    if (event.status === "failed") {
      providerPerformanceService.applyFailurePenalty(provider);
      providerHealthService.setHealth(provider, "degraded");
    }

    const diag = await providerDiagnosticsService.getDiagnostics(provider);
    console.log("Provider diagnostics:", diag);

    return diag;
  },
};
