module.exports.getProviderRoutingRules = function getProviderRoutingRules(provider) {
  if (provider === 'sinch') {
    return {
      hipaa: true,
      preferredRegions: ['us-east', 'us-west'],
      maxRetries: 2,
      failoverTo: 'telnyx',
      areaCodeBias: ['212', '305', '404'], // Sinch strong regions
      throughput: 'high',
    };
  }

  if (provider === 'telnyx') {
    return {
      hipaa: true,
      preferredRegions: ['us-central'],
      maxRetries: 3,
      failoverTo: 'sinch',
      areaCodeBias: ['615', '702', '919'], // Telnyx strong regions
      throughput: 'medium',
    };
  }

  return {
    hipaa: true,
    preferredRegions: [],
    maxRetries: 1,
    failoverTo: null,
    areaCodeBias: [],
    throughput: 'unknown',
  };
};
