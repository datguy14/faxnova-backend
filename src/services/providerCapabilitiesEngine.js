// src/services/providerCapabilitiesEngine.js

const providerDiagnosticsService = require("./providerDiagnosticsService");
const providerResidencyEngine = require("./providerResidencyEngine");

const PROVIDERS = ["sinch", "telnyx"];

module.exports = {
  isProviderAllowed(provider, constraints = {}) {
    const regions = {
      sinch: ["us", "eu", "ca"],
      telnyx: ["us", "eu", "ca"]
    }[provider] || [];

    const residencyZone = constraints.residencyZone?.toLowerCase();
    const requiredRegion = (constraints.region || residencyZone || "us").toLowerCase();

    return regions.includes(requiredRegion);
  },

  filterProviders(providers, constraints = {}) {
    return providers.filter((provider) =>
      this.isProviderAllowed(provider, constraints)
    );
  },

  getAllowedProvidersForFax(fax) {
    const constraints = fax.sovereigntyConstraints || {};
    return this.filterProviders(PROVIDERS, constraints);
  },

  async getProviderCapabilities(provider, fax = null) {
    const constraints = fax?.sovereigntyConstraints || {};

    const allowed = this.isProviderAllowed(provider, constraints);

    // Unified diagnostics snapshot
    const diag = await providerDiagnosticsService.getDiagnostics(provider);

    return {
      provider,
      allowed,
      health: diag.health,
      outageState: diag.outageState,
      latency: diag.latency,            // numeric latency.value
      latencyDetails: diag.latencyDetails,
      score: diag.score,
      weight: diag.routingWeight,       // unified weight
      circuitBreaker: diag.circuitBreaker,
      timestamp: diag.timestamp
    };
  },

  async getDiagnostics(fax = null) {
    const results = [];
    for (const provider of PROVIDERS) {
      results.push(await this.getProviderCapabilities(provider, fax));
    }
    return results;
  }
};
