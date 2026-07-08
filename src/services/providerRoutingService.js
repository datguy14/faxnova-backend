// src/services/providerRoutingService.js — Unified Fax Architecture (CommonJS Only)

module.exports = {
  getPrimaryProvider(tenant) {
    return tenant.providers.primary;
  },

  getFailoverProvider(tenant) {
    return tenant.providers.failover;
  },

  shouldTriggerFailover(providerResult) {
    // providerResult.ok === false means provider API failed
    if (!providerResult.ok) return true;

    // providerStatus from webhook normalization
    const status = providerResult.providerStatus;

    if (status === "fax.failed" || status === "fax.error") {
      return true;
    }

    return false;
  },

  preventInfiniteFailover(fax) {
    // If failover already used, do NOT failover again
    return fax.failoverUsed === true;
  }
};
