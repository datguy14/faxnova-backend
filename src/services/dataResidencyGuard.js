// src/services/dataResidencyGuard.js

const providerResidencyEngine = require("./providerResidencyEngine");

module.exports = {
  enforceForFax(fax, provider) {
    const constraints = fax.sovereigntyConstraints || {};
    const allowed = providerResidencyEngine.isProviderAllowed(provider, constraints);

    if (!allowed) {
      throw new Error(
        `Residency violation: provider ${provider} does not satisfy constraints ${JSON.stringify(
          constraints
        )}`
      );
    }

    return true;
  },

  buildDecisionLogEntry(fax, provider) {
    const constraints = fax.sovereigntyConstraints || {};
    const region = (constraints.region || "us").toLowerCase();

    return {
      provider,
      region,
      decidedAt: new Date(),
      reason: `Provider ${provider} selected for region ${region}`,
    };
  },
};
