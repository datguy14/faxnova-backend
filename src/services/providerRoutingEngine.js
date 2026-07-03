/**
 * src/services/providerRoutingEngine.js
 *
 * Strict‑mode provider routing engine:
 * - Percentile latency weighting (EWMA + p95 + p99)
 * - Health + outage state penalties (healthy → degraded → half_open → open → probation)
 * - Cooldown / probation exclusions/penalties
 * - Performance score scaling (0–100 baseline)
 * - Region‑aware selection (optional via fax.region)
 */

const providerHealthService = require("./providerHealthService");
const providerOutageService = require("./providerOutageService");
const providerPerformanceService = require("./providerPerformanceService");
const providerLatencyTracker = require("./providerLatencyTracker");
const providerScoreCache = require("./providerScoreCache");

const PROVIDERS = ["sinch", "telnyx"];

/**
 * Calculate latency penalty multiplier based on EWMA + percentiles
 */
function calculateLatencyPenalty(ewma, p95, p99) {
  const EWMA_CRITICAL = 5000;
  const EWMA_SEVERE = 2000;
  const P99_CRITICAL = 6000;
  const P95_SEVERE = 4000;

  let multiplier = 1.0;

  if (ewma > EWMA_CRITICAL) multiplier *= 0.2;
  else if (ewma > EWMA_SEVERE) multiplier *= 0.5;

  if (p99 > P99_CRITICAL) multiplier *= 0.25;
  if (p95 > P95_SEVERE) multiplier *= 0.6;

  return Math.max(0, multiplier);
}

/**
 * Calculate health state penalty multiplier
 */
function calculateHealthPenalty(healthState) {
  switch (healthState) {
    case "healthy": return 1.0;
    case "degraded": return 0.7;
    case "half_open": return 0.4;
    case "probation": return 0.3;
    case "open": return 0.0;
    default: return 1.0;
  }
}

/**
 * Apply outage state + cooldown/probation penalties
 */
function calculateOutagePenalty(outageState, cooldownUntil, probationUntil) {
  const now = new Date();

  if (outageState === "open") return 0.0;
  if (cooldownUntil && cooldownUntil > now) return 0.0;
  if (probationUntil && probationUntil > now) return 0.5;
  if (outageState === "half_open") return 0.5;
  if (outageState === "degraded") return 0.8;

  return 1.0;
}

/**
 * Build cache key for provider score
 */
function buildScoreCacheKey(provider, region) {
  return region
    ? `provider-score:${provider}:${region}`
    : `provider-score:${provider}`;
}

/**
 * Select the best provider for a fax based on weighted scoring
 */
async function selectProviderForFax(fax = {}) {
  const region = fax.region || null;
  const scores = [];

  for (const provider of PROVIDERS) {
    const cacheKey = buildScoreCacheKey(provider, region);
    const cached = await providerScoreCache.get(cacheKey);

    if (cached) {
      scores.push(cached);
      continue;
    }

    try {
      const [
        outageInfo,
        healthInfo,
        performanceScore,
        latencyMetrics
      ] = await Promise.all([
        providerOutageService.getOutageState(provider, region),
        providerHealthService.getHealth(provider, region),
        providerPerformanceService.getScore(provider, region),
        providerLatencyTracker.getPercentiles(provider, region)
      ]);

      const ewma = await providerLatencyTracker.getLatency(provider, region);
      const { p95, p99 } = latencyMetrics || { p95: 0, p99: 0 };

      const outageState = outageInfo?.outageState || "none";
      const cooldownUntil = outageInfo?.cooldownUntil || null;
      const probationUntil = outageInfo?.probationUntil || null;

      const healthState = healthInfo?.state || "healthy";

      // Hard exclusion via outage penalty
      const outagePenalty = calculateOutagePenalty(
        outageState,
        cooldownUntil,
        probationUntil
      );

      if (outagePenalty === 0) {
        const excluded = {
          provider,
          weight: 0,
          reason: "outage-or-cooldown",
          metrics: {
            performanceScore,
            healthState,
            outageState,
            ewma,
            p95,
            p99,
            cooldownUntil,
            probationUntil
          }
        };
        scores.push(excluded);
        await providerScoreCache.set(cacheKey, excluded);
        continue;
      }

      // Baseline performance score fallback
      let weight = typeof performanceScore === "number"
        ? performanceScore
        : 50;

      // Health penalty
      weight *= calculateHealthPenalty(healthState);

      // Latency penalty
      weight *= calculateLatencyPenalty(ewma || 0, p95 || 0, p99 || 0);

      // Outage penalty
      weight *= outagePenalty;

      // Region preference weighting
      if (region === "us" && provider === "sinch") weight *= 1.1;
      if (region === "eu" && provider === "telnyx") weight *= 1.1;

      const result = {
        provider,
        weight: Math.max(0, weight),
        metrics: {
          performanceScore,
          healthState,
          outageState,
          ewma,
          p95,
          p99,
          cooldownUntil,
          probationUntil,
          region
        }
      };

      scores.push(result);
      await providerScoreCache.set(cacheKey, result);

    } catch (err) {
      console.error(`[providerRoutingEngine] Error fetching metrics for ${provider}:`, err);
      const failed = {
        provider,
        weight: 0,
        reason: "metric-fetch-error",
        error: err.message
      };
      scores.push(failed);
      await providerScoreCache.set(cacheKey, failed);
    }
  }

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
 */
async function getDiagnostics(region = null) {
  const diagnostics = [];

  for (const provider of PROVIDERS) {
    try {
      const [
        outageInfo,
        healthInfo,
        performanceScore,
        latencyDiag
      ] = await Promise.all([
        providerOutageService.getDiagnostics(provider, region),
        providerHealthService.getHealth(provider, region),
        providerPerformanceService.getScore(provider, region),
        providerLatencyTracker.getDiagnostics(provider, region)
      ]);

      diagnostics.push({
        provider,
        region,
        performance: { score: performanceScore },
        health: healthInfo,
        outage: outageInfo,
        latency: latencyDiag
      });

    } catch (err) {
      console.error(`[providerRoutingEngine] Diagnostic error for ${provider}:`, err);
      diagnostics.push({
        provider,
        region,
        error: err.message
      });
    }
  }

  return diagnostics;
}

module.exports = {
  selectProviderForFax,
  getDiagnostics,
  calculateLatencyPenalty,
  calculateHealthPenalty,
  calculateOutagePenalty
};
