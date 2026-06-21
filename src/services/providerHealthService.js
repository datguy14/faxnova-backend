const providerPerformanceService = require("./providerPerformanceService");
const providerOutageService = require("./providerOutageService");

const providerHealthService = {
  async getCurrentHealth() {
    // 1. Performance metrics
    const performance = await providerPerformanceService.getPerformanceScores();

    // 2. Outage status
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

module.exports = providerHealthService;
