// src/services/providerBillingService.js

module.exports.getProviderBillingRates = function getProviderBillingRates(provider) {
  if (provider === 'sinch') {
    return {
      costPerPage: 0.0075, // 0.75 cents
      retryCostMultiplier: 1.0,
      failoverCostMultiplier: 1.25,
      regionSurcharge: {
        'us-east': 1.0,
        'us-west': 1.05,
        'us-central': 1.10,
      },
      slaPenaltyPerFailure: 0.002,
    };
  }

  if (provider === 'telnyx') {
    return {
      costPerPage: 0.0060, // 0.6 cents
      retryCostMultiplier: 1.1,
      failoverCostMultiplier: 1.15,
      regionSurcharge: {
        'us-central': 1.0,
        'us-east': 1.08,
        'us-west': 1.12,
      },
      slaPenaltyPerFailure: 0.0015,
    };
  }

  return {
    costPerPage: 0.01,
    retryCostMultiplier: 1.0,
    failoverCostMultiplier: 1.0,
    regionSurcharge: {},
    slaPenaltyPerFailure: 0,
  };
};
