const NodeCache = require("node-cache");
const audit = require("../audit/auditService");

const FAILURE_THRESHOLD = 3;
const COOLDOWN_MINUTES = 15;

const outageCache = new NodeCache({
  stdTTL: COOLDOWN_MINUTES * 60,
  checkperiod: 60
});

const providerOutageService = {
  async recordFailure(provider) {
    const key = `outage:${provider}`;
    const existing = outageCache.get(key) || { failures: 0, lastFailure: null };

    const updated = {
      failures: existing.failures + 1,
      lastFailure: new Date()
    };

    outageCache.set(key, updated);

    if (updated.failures >= FAILURE_THRESHOLD) {
      await audit.logEvent({
        type: "provider",
        action: "provider_outage_triggered",
        provider,
        details: updated
      });
    }

    return updated;
  },

  async getActiveOutages() {
    return outageCache
      .keys()
      .filter((k) => k.startsWith("outage:"))
      .map((k) => k.replace("outage:", ""));
  },

  async getOutageSummary() {
    return outageCache
      .keys()
      .filter((k) => k.startsWith("outage:"))
      .map((k) => {
        const provider = k.replace("outage:", "");
        const data = outageCache.get(k);

        return {
          provider,
          failures: data.failures,
          lastFailure: data.lastFailure,
          expiresInSeconds: outageCache.getTtl(k)
            ? Math.floor((outageCache.getTtl(k) - Date.now()) / 1000)
            : 0
        };
      });
  },

  async clearOutage(provider) {
    outageCache.del(`outage:${provider}`);

    await audit.logEvent({
      type: "provider",
      action: "provider_outage_cleared",
      provider
    });

    return true;
  }
};

module.exports = providerOutageService;
