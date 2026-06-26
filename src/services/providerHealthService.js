// src/services/providerHealthService.js

const providerPerformanceService = require("./providerPerformanceService");
const providerOutageService = require("./providerOutageService");
const FaxNovaError = require("../errors/FaxNovaError");

module.exports = {
  /**
   * Get current provider health snapshot.
   *
   * Returns:
   * {
   *   sinch: {
   *     avgLatencyMs,
   *     successRate,
   *     activeOutage
   *   },
   *   telnyx: {
   *     avgLatencyMs,
   *     successRate,
   *     activeOutage
   *   }
   * }
   */
  async getCurrentHealth() {
    try {
      // -----------------------------
      // 1. Load performance metrics
      // -----------------------------
      const performance = await providerPerformanceService.getPerformanceScores();

      // -----------------------------
      // 2. Load outage status
      // -----------------------------
      const outages = await providerOutageService.getOutages();

      // -----------------------------
      // 3. Normalize provider health
      // -----------------------------
      return {
        sinch: {
          avgLatencyMs: performance.sinch?.latency ?? 500,
          successRate: performance.sinch?.successRate ?? 0.95,
          activeOutage: outages.sinch?.active ?? false
        },
        telnyx: {
          avgLatencyMs: performance.telnyx?.latency ?? 500,
          successRate: performance.telnyx?.successRate ?? 0.95,
          activeOutage: outages.telnyx?.active ?? false
        }
      };
    } catch (err) {
      throw new FaxNovaError("Failed to load provider health", {
        code: "PROVIDER_HEALTH_ERROR",
        details: err.message
      });
    }
  }
};
