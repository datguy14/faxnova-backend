// src/services/providerPerformanceService.js

// For convergence, we keep this simple and deterministic.
// You can later plug in real logs/billing/SLAs.

exports.calculateProviderPerformance = async ({ logs, billing, health, region }) => {
  // Base score
  let performanceScore = 50;

  // Health impact
  if (health.status === "DOWN") performanceScore -= 40;
  if (health.status === "DEGRADED") performanceScore -= 10;

  // Region can tweak score if you want
  if (region === "us") performanceScore += 5;
  if (region === "eu") performanceScore += 3;

  // Clamp
  if (performanceScore < 0) performanceScore = 0;
  if (performanceScore > 100) performanceScore = 100;

  return { performanceScore };
};
