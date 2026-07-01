// src/services/providerCircuitBreaker.js

const CircuitBreaker = require("opossum");
const providerRoutingEngine = require("./providerRoutingEngine");
const providerHealthService = require("./providerHealthService");
const providerPerformanceService = require("./providerPerformanceService");
const sendToProvider = require("./sendFaxService"); // your actual provider API call

// Circuit breaker configuration (Hystrix-style)
const breakerOptions = {
  timeout: 10000,                 // fail fast after 10s
  errorThresholdPercentage: 50,   // open circuit after 50% failures
  resetTimeout: 30000,            // try again after 30s
  volumeThreshold: 5              // minimum number of calls before evaluating
};

// Wrap provider API call
const breaker = new CircuitBreaker(async (fax) => {
  const provider = fax.provider;

  try {
    const result = await sendToProvider(fax, provider);

    // Provider succeeded → boost score + healthy
    providerPerformanceService.applySuccessBoost(provider);
    providerHealthService.setHealth(provider, "healthy");

    return result;
  } catch (err) {
    // Provider failed → penalty + degraded
    providerPerformanceService.applyFailurePenalty(provider);
    providerHealthService.setHealth(provider, "degraded");

    throw err;
  }
}, breakerOptions);

// Fallback: route to next best provider
breaker.fallback(async (fax) => {
  const nextProvider = await providerRoutingEngine.selectProvider();

  fax.provider = nextProvider;

  return sendToProvider(fax, nextProvider);
});

// Event listeners (optional but useful for logging)
breaker.on("open", () => {
  console.log("⚠️ Circuit OPEN — provider temporarily disabled");
});

breaker.on("halfOpen", () => {
  console.log("🔄 Circuit HALF-OPEN — testing provider recovery");
});

breaker.on("close", () => {
  console.log("✅ Circuit CLOSED — provider restored");
});

module.exports = breaker;
