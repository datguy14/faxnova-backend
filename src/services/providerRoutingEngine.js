/**
 * src/services/providerRoutingEngine.js
 *
 * Unified provider routing engine using:
 * - Percentile latency weighting (EWMA + p95 + p99)
 * - Health state penalties (healthy → degraded → half-open → down)
 * - Outage state exclusions (open → hard 0 weight)
 * - Performance score scaling (0-100 baseline)
 *
 * Returns the best available provider based on weighted scoring.
 */

const providerHealthService = require("./providerHealthService");
const providerOutageService = require("./providerOutageService");
const providerPerformanceService = require("./providerPerformanceService");
const providerLatencyTracker = require("./providerLatencyTracker");

const PROVIDERS = ["sinch", "telnyx"];

/**
 * Calculate latency penalty multiplier based on EWMA + percentiles
 * @param {number} ewma - Exponential weighted moving average (ms)
 * @param {number} p95 - 95th percentile latency (ms)
 * @param {number} p99 - 99th percentile latency (ms)
 * @returns {number} - Multiplier (0.0 to 1.0)
 */
function calculateLatencyPenalty(ewma, p95, p99) {
  // Thresholds for latency degradation
  const EWMA_CRITICAL = 5000;
  const EWMA_SEVERE = 2000;
  const P99_CRITICAL = 6000;
  const P95_SEVERE = 4000;

  let multiplier = 1.0;

  // EWMA penalties (exponential moving average is most reactive)
  if (ewma > EWMA_CRITICAL) {
    multiplier *= 0.2; // 80% penalty if EWMA is critical
  } else if (ewma > EWMA_SEVERE) {
    multiplier *= 0.5; // 50% penalty if EWMA is severe
  }

  // P99 penalties (tail latency indicator)
  if (p99 > P99_CRITICAL) {
    multiplier *= 0.25; // 75% penalty if p99 is critical
  }

  // P95 penalties (broader context)
  if (p95 > P95_SEVERE) {
    multiplier *= 0.6; // 40% penalty if p95 is severe
  }

  return Math.max(0, multiplier);
}

/**
 * Calculate health state penalty multiplier
 * @param {string} health - Health state (healthy | degraded | half-open | down)
 * @returns {number} - Multiplier (0.0 to 1.0)
 */
function calculateHealthPenalty(health) {
  switch (health) {
    case "healthy":
      return 1.0;
    case "degraded":
      return 0.7; // 30% penalty
    case "half-open":
      return 0.4; // 60% penalty
    case "down":
      return 0.0; // 100% penalty (effectively excluded)
    default:
      return 1.0;
  }
}

/**
 * Select the best provider for a fax based on weighted scoring
 * @param {object} fax - Fax object (optional, for future contextual routing)
 * @returns {string} - Provider name (sinch | telnyx)
 * @throws {Error} - If no available providers
 */
async function selectProviderForFax(fax) {
  const scores = [];

  for (const provider of PROVIDERS) {
    try {
      // Fetch all metrics in parallel for performance
      const [outageState, health, performanceScore, latencyMetrics] = await Promise.all([
        providerOutageService.getOutageState(provider),
        providerHealthService.getHealth(provider),
        providerPerformanceService.getScore(provider),
        providerLatencyTracker.getPercentiles(provider)
      ]);

      const ewma = await providerLatencyTracker.getLatency(provider);
      const { p95, p99 } = latencyMetrics;

      // Hard exclusion: provider in full outage
      if (outageState === "open") {
        scores.push({
          provider,
          weight: 0,
          reason: "provider-open-outage"
        });
        continue;
      }

      // Start with performance score (baseline 0-100)
      let weight = performanceScore;

      // Apply health state penalty
      const healthPenalty = calculateHealthPenalty(health);
      weight *= healthPenalty;

      // Apply latency penalties (EWMA + percentiles)
      const latencyPenalty = calculateLatencyPenalty(ewma, p95, p99);
      weight *= latencyPenalty;

      // Soft penalty for half-open state (extra caution)
      if (outageState === "half-open") {
        weight *= 0.5; // 50% penalty for half-open
      }

      scores.push({
        provider,
        weight: Math.max(0, weight),
        metrics: {
          performanceScore,
          health,
          outageState,
          ewma,
          p95,
          p99
        }
      });
    } catch (err) {
      // If metric fetch fails, treat as unhealthy
      console.error(`[providerRoutingEngine] Error fetching metrics for ${provider}:`, err);
      scores.push({
        provider,
        weight: 0,
        reason: "metric-fetch-error"
      });
    }
  }

  // Sort by weight descending
  scores.sort((a, b) => b.weight - a.weight);

  const best = scores[0];
  if (!best || best.weight <= 0) {
    throw new Error(
      `[providerRoutingEngine] No available providers. Scores: ${JSON.stringify(scores)}`
    );
  }

  return best.provider;
}

/**
 * Get diagnostic information for all providers
 * @returns {array} - Array of provider scores with full metrics
 */
async function getDiagnostics() {
  const diagnostics = [];

  for (const provider of PROVIDERS) {
    try {
      const [outageState, health, performanceScore, latencyDiag] = await Promise.all([
        providerOutageService.getOutageState(provider),
        providerHealthService.getHealth(provider),
        providerPerformanceService.getScore(provider),
        providerLatencyTracker.getDiagnostics(provider)
      ]);

      const outageDiag = await providerOutageService.getDiagnostics(provider);

      diagnostics.push({
        provider,
        performance: {
          score: performanceScore
        },
        health: {
          state: health
        },
        outage: outageDiag,
        latency: latencyDiag
      });
    } catch (err) {
      console.error(`[providerRoutingEngine] Diagnostic error for ${provider}:`, err);
      diagnostics.push({
        provider,
        error: err.message
      });
    }
  }

  return diagnostics;
}

module.exports = {
  selectProviderForFax,
  getDiagnostics,
  // Exported for testing
  calculateLatencyPenalty,
  calculateHealthPenalty
};
