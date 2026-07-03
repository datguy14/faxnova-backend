// src/services/providerCircuitBreaker.js — STRICT-MODE VERSION

const CircuitBreaker = require("opossum");
const { sendToProvider } = require("./providerApiService");
const providerOutageService = require("./providerOutageService");
const providerHealthService = require("./providerHealthService");
const providerPerformanceService = require("./providerPerformanceService");

// Unified strict-mode outage states
const STATES = {
  HEALTHY: "healthy",
  DEGRADED: "degraded",
  HALF_OPEN: "half_open",
  OPEN: "open",
  PROBATION: "probation"
};

// Circuit breaker configuration
const breaker = new CircuitBreaker(sendToProvider, {
  timeout: 10000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 5
});

/**
 * FAILURE HANDLER
 * Called when provider API throws or times out
 */
breaker.on("failure", async (fax, error) => {
  const provider = fax.provider;

  // Update outage engine
  await providerOutageService.recordFailure(provider);

  // Update health engine
  await providerHealthService.evaluate(provider);

  // Update performance engine
  await providerPerformanceService.recordFailure(provider);

  console.error(`[CircuitBreaker] FAILURE for provider ${provider}:`, error.message);
});

/**
 * SUCCESS HANDLER
 * Called when provider API succeeds
 */
breaker.on("success", async (result, fax) => {
  const provider = fax.provider;

  // Update outage engine
  await providerOutageService.recordSuccess(provider);

  // Update health engine
  await providerHealthService.evaluate(provider);

  // Update performance engine
  await providerPerformanceService.recordSuccess(provider);

  console.log(`[CircuitBreaker] SUCCESS for provider ${provider}`);
});

/**
 * OPEN → HALF_OPEN transition
 */
breaker.on("open", () => {
  console.warn("[CircuitBreaker] Provider entered OPEN state");
});

/**
 * HALF_OPEN → HEALTHY transition
 */
breaker.on("halfOpen", () => {
  console.warn("[CircuitBreaker] Provider entered HALF_OPEN state");
});

/**
 * Fallback → failover provider
 */
breaker.fallback(async (fax) => {
  const nextProvider = fax.provider === "sinch" ? "telnyx" : "sinch";
  fax.provider = nextProvider;

  console.warn(`[CircuitBreaker] FAILOVER → switching to ${nextProvider}`);

  return sendToProvider(fax);
});

module.exports = breaker;
