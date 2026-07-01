// src/services/providerCircuitBreaker.js — FIXED
const CircuitBreaker = require("opossum");
const { sendToProvider } = require("./providerApiService"); // No circular dep
const providerPerformanceService = require("./providerPerformanceService");
const providerHealthService = require("./providerHealthService");

const breaker = new CircuitBreaker(sendToProvider, {
  timeout: 10000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 5
});

// Fallback to failover provider
breaker.fallback(async (fax) => {
  const nextProvider = fax.provider === "sinch" ? "telnyx" : "sinch";
  fax.provider = nextProvider;
  return sendToProvider(fax);
});

module.exports = breaker;
