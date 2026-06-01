// src/services/providerOutageService.js

let providerHealth = {
  sinch: { status: 'HEALTHY', lastUpdated: null, errorRate: 0, latency: 0 },
  telnyx: { status: 'HEALTHY', lastUpdated: null, errorRate: 0, latency: 0 },
};

const ERROR_THRESHOLD = 0.25; // 25% error rate
const LATENCY_THRESHOLD = 8000; // 8 seconds
const FAILURE_WINDOW = 10 * 60 * 1000; // 10 minutes

module.exports.updateProviderHealth = function updateProviderHealth(provider, logs) {
  const now = Date.now();

  const errors = logs.filter(l => l.event === 'error').length;
  const total = logs.length;
  const errorRate = total > 0 ? errors / total : 0;

  const latencyEvents = logs.filter(l => l.latency);
  const avgLatency = latencyEvents.length
    ? latencyEvents.reduce((a, b) => a + b.latency, 0) / latencyEvents.length
    : 0;

  let status = 'HEALTHY';

  if (errorRate > ERROR_THRESHOLD || avgLatency > LATENCY_THRESHOLD) {
    status = 'DEGRADED';
  }

  if (errorRate > 0.5) {
    status = 'DOWN';
  }

  providerHealth[provider] = {
    status,
    lastUpdated: now,
    errorRate,
    latency: avgLatency,
  };

  return providerHealth[provider];
};

module.exports.getProviderHealth = function getProviderHealth(provider) {
  return providerHealth[provider] || { status: 'UNKNOWN' };
};
