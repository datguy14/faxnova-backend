// src/services/providerFailoverService.js

module.exports.getFailoverProvider = function getFailoverProvider({
  provider,
  providerHealth,
  routingRules,
  lastErrorCode,
  retryCount,
  areaCode,
}) {
  // 1. Immediate failover errors
  if (routingRules.immediateFailoverErrors.includes(String(lastErrorCode))) {
    return routingRules.failoverTo;
  }

  // 2. Provider DOWN → failover
  if (providerHealth.status === 'DOWN') {
    return routingRules.failoverTo;
  }

  // 3. Provider DEGRADED → conditional failover
  if (providerHealth.status === 'DEGRADED') {
    // If area code bias favors failover provider
    if (routingRules.areaCodeBias.includes(areaCode)) {
      return routingRules.failoverTo;
    }
  }

  // 4. Retry count exceeded → failover
  if (retryCount >= routingRules.maxRetries) {
    return routingRules.failoverTo;
  }

  // 5. No failover needed
  return provider;
};
