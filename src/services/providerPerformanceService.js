// src/services/providerPerformanceService.js

module.exports.calculateProviderPerformance = function calculateProviderPerformance({
  logs,
  billing,
  health,
  region,
}) {
  const total = logs.length;
  const errors = logs.filter(l => l.event === 'error').length;
  const retries = logs.filter(l => l.event === 'retry').length;

  const latencyEvents = logs.filter(l => l.latency);
  const avgLatency = latencyEvents.length
    ? latencyEvents.reduce((a, b) => a + b.latency, 0) / latencyEvents.length
    : 0;

  const errorRate = total > 0 ? errors / total : 0;
  const retryRate = total > 0 ? retries / total : 0;

  // SLA score (0–100)
  const slaScore = Math.max(0, 100 - (errorRate * 100) - (retryRate * 50));

  // Cost efficiency score (0–100)
  const costScore = Math.max(
    0,
    100 - (billing.costPerPage * 1000) - (billing.regionSurcharge[region] || 1) * 10
  );

  // Stability score (0–100)
  const stabilityScore = health.status === 'HEALTHY'
    ? 100
    : health.status === 'DEGRADED'
    ? 60
    : 20;

  return {
    avgLatency,
    errorRate,
    retryRate,
    slaScore,
    costScore,
    stabilityScore,
    performanceScore: Math.round(
      (slaScore * 0.4) +
      (costScore * 0.2) +
      (stabilityScore * 0.3) +
      ((1 - errorRate) * 100 * 0.1)
    ),
  };
};
