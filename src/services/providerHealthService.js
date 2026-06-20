// src/services/providerHealthService.js

/**
 * Provider Health Service (v1)
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
    const performance = await providerPerformanceService.getProviderPerformance();
    const outages = await providerOutageService.getOutages();

    return {
      sinch: {
        avgLatencyMs: performance.sinch?.avgLatencyMs ?? 500,
        successRate: performance.sinch?.successRate ?? 0.8,
        activeOutage: outages.sinch?.active ?? false,
      },
      telnyx: {
        avgLatencyMs: performance.telnyx?.avgLatencyMs ?? 500,
        successRate: performance.telnyx?.successRate ?? 0.8,
        activeOutage: outages.telnyx?.active ?? false,
      },
    };
  },
};
