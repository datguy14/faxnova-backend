// src/services/providerRouter.v2.js — Strict‑Mode CommonJS Version

const providerOutageService = require("../services/providerOutageService");
const providerPerformanceService = require("../services/providerPerformanceService");

exports.routeProvider = async ({ provider, region }) => {
  // 1. Get provider health (UP, DOWN, DEGRADED)
  const health = await providerOutageService.getProviderHealth(provider);

  // 2. Convert health → outage penalty
  const outagePenalty =
    health.status === "DOWN"
      ? 999
      : health.status === "DEGRADED"
      ? 1.5
      : 0;

  // 3. Calculate provider performance score
  const perf = await providerPerformanceService.calculateProviderPerformance({
    logs: [],
    billing: [],
    health,
    region
  });

  // 4. Convert performance → boost factor
  const performanceBoost = perf.performanceScore / 50;

  // 5. Final routing score
  const score = outagePenalty + performanceBoost;

  return {
    provider,
    region,
    health,
    outagePenalty,
    performanceBoost,
    score
  };
};
