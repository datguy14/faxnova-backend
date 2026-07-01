// src/services/providerCapabilitiesEngine.js

/**
 * Provider Capabilities Engine
 * Unified module combining:
 *  - Residency / Sovereignty constraints
 *  - Latency tracking
 *  - Diagnostics aggregation
 */

const providerLatencyTracker = require("./providerLatencyTracker");
const providerHealthService = require("./providerHealthService");
const providerOutageService = require("./providerOutageService");
const providerPerformanceService = require("./providerPerformanceService");
const FaxNovaError = require("../errors/FaxNovaError");

// Unified provider region map
const PROVIDER_REGIONS = {
  sinch: ["us", "eu", "ca"],
  telnyx: ["us", "eu", "ca"]
};

module.exports = {
  /**
   * Residency + sovereignty check
   */
  isProviderAllowed(provider, constraints = {}) {
    const regions = PROVIDER_REGIONS[provider] || [];

    const residencyZone = constraints.residencyZone?.toLowerCase();
    const requiredRegion = (constraints.region || residencyZone || "us").toLowerCase();

    return regions.includes(requiredRegion);
  },

  /**
   * Filter providers by residency + sovereignty
   */
  filterProviders(providers, constraints = {}) {
    return providers.filter((provider) =>
      this.isProviderAllowed(provider, constraints)
    );
  },

  /**
   * Get allowed providers for a fax
   */
  getAllowedProvidersForFax(fax) {
    const constraints = fax.sovereigntyConstraints || {};
    const providers = Object.keys(PROVIDER_REGIONS);

    return this.filterProviders(providers, constraints);
  },

  /**
   * Get full provider capabilities:
   *  - residency allowed
   *  - health state
   *  - outage state
   *  - latency
   *  - performance score
   *  - computed weight
   */
  async getProviderCapabilities(provider, fax = null) {
    const constraints = fax?.sovereigntyConstraints || {};

    const allowed = this.isProviderAllowed(provider, constraints);
    const health = providerHealthService.getHealth(provider);
    const outage = await providerOutageService.isOutage(provider);
    const latency = await providerLatencyTracker.getLatency(provider);
    const score = providerPerformanceService.getScore(provider);

    const healthWeight = health === "degraded" ? 0.5 : 1;
    const latencyPenalty = latency > 5000 ? 0.7 : 1;

    const weight =
      allowed && !outage && health !== "down"
        ? score * healthWeight * latencyPenalty
        : 0;

    return {
      provider,
      allowed,
      health,
      outage,
      latency,
      score,
      weight
    };
  },

  /**
   * Get diagnostics for all providers
   */
  async getDiagnostics(fax = null) {
    const providers = Object.keys(PROVIDER_REGIONS);

    const diagnostics = [];
    for (const provider of providers) {
      diagnostics.push(await this.getProviderCapabilities(provider, fax));
    }

    return diagnostics;
  }
};
