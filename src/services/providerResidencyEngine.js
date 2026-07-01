// src/services/providerResidencyEngine.js

const PROVIDER_REGIONS = {
  sinch: ["us", "eu"],
  telnyx: ["us"],
};

module.exports = {
  isProviderAllowed(provider, constraints = {}) {
    const regions = PROVIDER_REGIONS[provider] || [];
    const requiredRegion = (constraints.region || "us").toLowerCase();

    if (!constraints.region) {
      return regions.includes("us");
    }

    return regions.includes(requiredRegion);
  },

  filterProviders(providers, constraints = {}) {
    return providers.filter((provider) =>
      this.isProviderAllowed(provider, constraints)
    );
  },

  getAllowedProvidersForFax(fax) {
    const constraints = fax.sovereigntyConstraints || {};
    const providers = Object.keys(PROVIDER_REGIONS);

    return this.filterProviders(providers, constraints);
  },
};
