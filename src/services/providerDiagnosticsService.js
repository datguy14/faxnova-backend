/**
 * src/services/providerDiagnosticsService.js
 *
 * Unified diagnostics service providing full visibility into provider health,
 * performance, outage state, and latency metrics.
 *
 * Used by:
 * - Admin dashboards (health status, metrics)
 * - Monitoring systems (alerts, thresholds)
 * - Routing engine (scoring and selection)
 */

const providerOutageService = require("./providerOutageService");
const providerHealthService = require("./providerHealthService");
const providerPerformanceService = require("./providerPerformanceService");
const providerLatencyTracker = require("./providerLatencyTracker");
const FaxNovaError = require("../errors/FaxNovaError");

const PROVIDERS = ["sinch", "telnyx"];

/**
 * Get full diagnostics for a single provider
 *
 * Returns:
 * - Current health state (healthy | degraded | half-open | down)
 * - Outage state (closed | half-open | open)
 * - Circuit breaker details (failures, cooldown remaining, probation)
 * - Performance score (0-100)
 * - Latency metrics (EWMA, p95, p99)
 *
 * @param {string} provider - Provider name
 * @returns {Promise<object>} - Structured diagnostic object
 * @throws {FaxNovaError} - If diagnostics unavailable
 */
async function getProviderDiagnostics(provider) {
  try {
    // Fetch all metrics in parallel
    const [
      outageState,
      health,
      score,
      latency,
      outageDetails,
      latencyMetrics
    ] = await Promise.all([
      providerOutageService.getOutageState(provider),
      providerHealthService.getHealth(provider),
      providerPerformanceService.getScore(provider),
      providerLatencyTracker.getLatency(provider),
      providerOutageService.getDiagnostics(provider),
      providerLatencyTracker.getPercentiles(provider)
    ]);

    return {
      provider,
      timestamp: new Date().toISOString(),

      // Health and outage state
      health,
      outageState,

      // Performance metrics
      performance: {
        score // 0-100
      },

      // Outage circuit breaker details
      outage: {
        state: outageState,
        failures: outageDetails.failures,
        lastFailureAt: outageDetails.lastFailureAt,
        openedAt: outageDetails.openedAt,
        probationUntil: outageDetails.probationUntil,
        cooldownRemaining: outageDetails.cooldownRemaining,
        probationRemaining: outageDetails.probationRemaining
      },

      // Latency metrics
      latency: {
        ewma: latency,
        p95: latencyMetrics.p95,
        p99: latencyMetrics.p99
      }
    };

  } catch (err) {
    throw new FaxNovaError("Failed to fetch diagnostics", {
      code: "DIAGNOSTICS_FETCH_FAILED",
      provider,
      details: err.message
    });
  }
}

/**
 * Get diagnostics for all providers
 *
 * @returns {Promise<array>} - Array of provider diagnostics
 * @throws {FaxNovaError} - If all providers fail
 */
async function getAllDiagnostics() {
  try {
    const diagnostics = await Promise.all(
      PROVIDERS.map(provider =>
        getProviderDiagnostics(provider).catch(err => ({
          provider,
          error: err.message,
          timestamp: new Date().toISOString()
        }))
      )
    );

    return diagnostics;

  } catch (err) {
    throw new FaxNovaError("Failed to fetch all diagnostics", {
      code: "ALL_DIAGNOSTICS_FAILED",
      details: err.message
    });
  }
}

/**
 * Get summary health status across all providers
 *
 * @returns {Promise<object>} - Summary with overall status
 */
async function getHealthSummary() {
  try {
    const diagnostics = await getAllDiagnostics();

    const summary = {
      timestamp: new Date().toISOString(),
      providers: diagnostics,
      overallStatus: "healthy"
    };

    // Determine overall status
    const hasDown = diagnostics.some(d => d.health === "down");
    const hasDegraded = diagnostics.some(d => d.health === "degraded");

    if (hasDown) {
      summary.overallStatus = "critical"; // At least one provider down
    } else if (hasDegraded) {
      summary.overallStatus = "degraded"; // At least one provider degraded
    } else {
      summary.overallStatus = "healthy"; // All providers healthy
    }

    return summary;

  } catch (err) {
    throw new FaxNovaError("Failed to generate health summary", {
      code: "HEALTH_SUMMARY_FAILED",
      details: err.message
    });
  }
}

module.exports = {
  getProviderDiagnostics,
  getAllDiagnostics,
  getHealthSummary
};
