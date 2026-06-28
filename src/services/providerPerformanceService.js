// src/services/providerPerformanceService.js

const FaxNovaError = require("../errors/FaxNovaError");

// In‑memory metrics (can later be moved to Redis)
const metrics = {
  sinch: {
    successes: 0,
    failures: 0,
    totalLatencyMs: 0
  },
  telnyx: {
    successes: 0,
    failures: 0,
    totalLatencyMs: 0
  }
};

/**
 * Record a successful send with latency
 */
function recordSuccess(provider, latencyMs) {
  if (!metrics[provider]) {
    throw new FaxNovaError("Unknown provider for performance tracking", {
      code: "PERF_PROVIDER_UNKNOWN",
      provider
    });
  }

  metrics[provider].successes += 1;
  metrics[provider].totalLatencyMs += latencyMs || 0;
}

/**
 * Record a failed send
 */
function recordFailure(provider) {
  if (!metrics[provider]) {
    throw new FaxNovaError("Unknown provider for performance tracking", {
      code: "PERF_PROVIDER_UNKNOWN",
      provider
    });
  }

  metrics[provider].failures += 1;
}

/**
 * Compute a simple health score per provider
 * (0–100, based on success rate + latency)
 */
function getHealthScore(provider) {
  const m = metrics[provider];
  if (!m) {
    throw new FaxNovaError("Unknown provider for health score", {
      code: "PERF_PROVIDER_UNKNOWN",
      provider
    });
  }

  const total = m.successes + m.failures;
  if (total === 0) return 100; // no data yet → assume healthy

  const successRate = m.successes / total; // 0–1
  const avgLatency =
    m.successes > 0 ? m.totalLatencyMs / m.successes : 1000; // ms

  // Very simple scoring: success rate weighted against latency
  let score = successRate * 100;

  if (avgLatency > 3000) score -= 30;
  else if (avgLatency > 2000) score -= 20;
  else if (avgLatency > 1000) score -= 10;

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  return Math.round(score);
}

/**
 * Get scores for all providers (used by providerScoreCache + routingService.v2)
 */
function getScores() {
  return {
    sinch: getHealthScore("sinch"),
    telnyx: getHealthScore("telnyx")
  };
}

module.exports = {
  recordSuccess,
  recordFailure,
  getHealthScore,
  getScores
};
