// src/services/providerRoutingRules.js

module.exports.getProviderRoutingRules = function getProviderRoutingRules(provider) {
  if (provider === 'sinch') {
    return {
      hipaa: true,

      // Preferred delivery regions
      preferredRegions: ['us-east', 'us-west'],

      // Retry intelligence
      maxRetries: 2,
      retryDelays: [5000, 15000], // 5s then 15s

      // Failover logic
      failoverTo: 'telnyx',

      // Errors that should trigger immediate failover
      immediateFailoverErrors: ['4001'], // Document conversion failure

      // Area codes where Sinch performs best
      areaCodeBias: ['212', '305', '404'],

      throughput: 'high',
    };
  }

  if (provider === 'telnyx') {
    return {
      hipaa: true,

      // Preferred delivery regions
      preferredRegions: ['us-central'],

      // Retry intelligence
      maxRetries: 3,
      retryDelays: [3000, 10000, 20000], // 3s, 10s, 20s

      // Failover logic
      failoverTo: 'sinch',

      // Errors that should trigger immediate failover
      immediateFailoverErrors: ['30003'], // Negotiation failed

      // Area codes where Telnyx performs best
      areaCodeBias: ['615', '702', '919'],

      throughput: 'medium',
    };
  }

  // Default fallback for unknown providers
  return {
    hipaa: true,
    preferredRegions: [],
    maxRetries: 1,
    retryDelays: [5000],
    failoverTo: null,
    immediateFailoverErrors: [],
    areaCodeBias: [],
    throughput: 'unknown',
  };
};
