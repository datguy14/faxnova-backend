module.exports = {
  successRateThreshold: 0.95,     // 95% delivery success
  latencyThresholdMs: 3000,       // 3 seconds max average latency
  errorRateThreshold: 0.03,       // 3% error rate max
  evaluationWindow: 100           // last 100 faxes
};
