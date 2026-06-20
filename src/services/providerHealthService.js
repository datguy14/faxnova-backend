// src/services/providerHealthService.js

/**
 * Provider Health Service
 * -----------------------------------------
 * Routing Engine v2 needs:
 * - avgLatencyMs
 * - successRate
 * - activeOutage
 *
 * This service pulls that data from:
 * - providerPerformanceService
 * - providerOutageService
 */

import { providerPerformanceService } from "./providerPerformanceService.js";
import { providerOutageService } from "./providerOutageService.js";

export const providerHealthService = {
  async getCurrentHealth() {
    // 1. Get performance metrics (latency + success rate)
    const performance = await providerPerformanceService.getPerformanceScores();

    // 2. Get outage status
    const outages = await providerOutageService.getOutages();

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
  }
};
