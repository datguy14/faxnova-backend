// src/services/providerResidencyEngine.js

// Simple residency map for now — can be moved to DB or config later
const PROVIDER_REGIONS = {
  sinch: ["us", "eu"],
  telnyx: ["us"],
};

module.exports = {
  // ---------------------------------------------------------
  // Check if provider satisfies residency constraints
  // ---------------------------------------------------------
  isProviderAllowed(provider, constraints = {}) {
    const regions = PROVIDER_REGIONS[provider] || [];
    const requiredRegion = (constraints.region || "us").toLowerCase();

    // If no explicit region constraint, allow if provider supports "us"
    if (!constraints.region) {
      return regions.includes("us");
    }

    return regions.includes(requiredRegion);
  },

  // ---------------------------------------------------------
  // Filter providers by residency constraints
  // ---------------------------------------------------------
  filterProviders(providers, constraints = {}) {
    return providers.filter((provider) =>
      this.isProviderAllowed(provider, constraints)
    );
  },

  // ---------------------------------------------------------
  // Get allowed providers for a fax (based on constraints)
  // ---------------------------------------------------------
  getAllowedProvidersForFax(fax) {
    const constraints = fax.sovereigntyConstraints || {};
    const providers = Object.keys(PROVIDER_REGIONS);

    return this.filterProviders(providers, constraints);
  },
};
