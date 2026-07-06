// src/services/providerRouter.v2.js

const providerOutageService = require("./providerOutageService");
const providerPerformanceService = require("./providerPerformanceService");

exports.routeProvider = async ({ provider, region }) => {
  const health = await providerOutageService.getProviderHealth(provider);

  const outagePenalty =
    health.status === "DOWN" ? 999 :
    health.status === "DEGRADED" ? 1.5 :
    0;

  const perf = await providerPerformanceService.calculateProviderPerformance({
    logs: [],
    billing: [],
    health,
    region
  });

  const performanceBoost = perf.performanceScore / 50;

  return {
    provider,
    region,
    health,
    outagePenalty,
    performanceBoost,
    score: outagePenalty + performanceBoost
  };
};
