// Tracks provider success/failure counts + computes performance metrics

const performanceMap = new Map();

/**
 * Ensure provider entry exists
 */
function ensure(provider) {
  if (!performanceMap.has(provider)) {
    performanceMap.set(provider, {
      success: 0,
      fail: 0,
      lastSuccessAt: null,
      lastFailAt: null
    });
  }
  return performanceMap.get(provider);
}

/**
 * Record a successful fax event
 */
exports.recordSuccess = (provider) => {
  const entry = ensure(provider);
  entry.success += 1;
  entry.lastSuccessAt = new Date();
};

/**
 * Record a failed fax event
 */
exports.recordFailure = (provider) => {
  const entry = ensure(provider);
  entry.fail += 1;
  entry.lastFailAt = new Date();
};

/**
 * Compute performance metrics
 */
exports.getPerformance = (provider) => {
  const entry = ensure(provider);

  const total = entry.success + entry.fail;
  const successRate = total === 0 ? 1 : entry.success / total;
  const failRate = total === 0 ? 0 : entry.fail / total;

  return {
    provider,
    success: entry.success,
    fail: entry.fail,
    successRate: Number(successRate.toFixed(3)),
    failRate: Number(failRate.toFixed(3)),
    lastSuccessAt: entry.lastSuccessAt,
    lastFailAt: entry.lastFailAt
  };
};

/**
 * Reset provider metrics (admin-only)
 */
exports.resetPerformance = (provider) => {
  performanceMap.delete(provider);
};
