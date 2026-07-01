const CircuitBreaker = require("opossum");
const providerRoutingEngine = require("./providerRoutingEngine");
const sendToProvider = require("./providerApiService"); // your actual provider call

const breakerOptions = {
  timeout: 10000,                 // fail fast
  errorThresholdPercentage: 50,   // open circuit after 50% failures
  resetTimeout: 30000,            // try again after 30s
  volumeThreshold: 5              // minimum number of calls before evaluating
};

const breaker = new CircuitBreaker(sendToProvider, breakerOptions);

// Fallback: route to next best provider
breaker.fallback(async (fax) => {
  const nextProvider = await providerRoutingEngine.selectProvider();
  return sendToProvider(fax, nextProvider);
});

module.exports = breaker;
