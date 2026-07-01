// src/services/sendFaxService.js

const breaker = require("./providerCircuitBreaker");
const providerRoutingEngine = require("./providerRoutingEngine");
const providerHealthService = require("./providerHealthService");
const providerPerformanceService = require("./providerPerformanceService");

// This function is called by workers and faxService
async function sendFax(fax) {
  try {
    // Ensure provider is selected if not already set
    if (!fax.provider) {
      fax.provider = await providerRoutingEngine.selectProvider();
    }

    // Fire through circuit breaker
    const result = await breaker.fire(fax);

    // Provider succeeded → health + score already updated by breaker
    return {
      success: true,
      provider: fax.provider,
      result,
    };

  } catch (err) {
    // Provider failed → breaker already applied penalty + degraded health
    return {
      success: false,
      provider: fax.provider,
      error: err.message || err,
    };
  }
}

module.exports = {
  sendFax,
};
