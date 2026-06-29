const providerLatencyTracker = require("./providerLatencyTracker");
const providerOutageService = require("./providerOutageService");
const providerPerformanceService = require("./providerPerformanceService");
const providerScoreCache = require("./providerScoreCache");

exports.getProviderHealth = async (providerName) => {
  try {
    // 1. Latency (ms)
    const latency = providerLatencyTracker.getLatency(providerName);

    // 2. Outage status
    const outageInfo = providerOutageService.getOutage(providerName);

    // 3. Performance score (success rate, fail rate, etc.)
    const performance = providerPerformanceService.getPerformance(providerName);

    // 4. Sovereignty routing score (cached)
    const score = providerScoreCache.getScore(providerName);

    return {
      provider: providerName,
      latency,
      outage: outageInfo,
      performance,
      score,
      healthy:
        outageInfo?.isDown === false &&
        latency !== null &&
        performance?.successRate >= 0.85
    };
  } catch (err) {
    console.error("PROVIDER HEALTH ERROR:", err);
    return {
      provider: providerName,
      healthy: false,
      error: err.message
    };
  }
};

// Bulk health for dashboard
exports.getAllProvidersHealth = async () => {
  const providers = providerScoreCache.getProviders(); // returns list of provider names

  const results = [];
  for (const p of providers) {
    const health = await exports.getProviderHealth(p);
    results.push(health);
  }

  return results;
};
