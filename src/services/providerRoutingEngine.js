// providerRoutingEngine.js

const providerHealthService = require("./providerHealthService");
const providerPerformanceService = require("./providerPerformanceService");

// List of providers FaxNova supports
const PROVIDERS = ["sinch", "telnyx"];

module.exports = {
  // ---------------------------------------------------------
  // Return all providers with health + score
  // ---------------------------------------------------------
  getAllProviders() {
    return PROVIDERS.map((provider) => ({
      name: provider,
      score: providerPerformanceService.getScore(provider),
      health: providerHealthService.getHealth(provider),
    }));
  },

  // ---------------------------------------------------------
  // Select best provider using sovereignty routing
  // ---------------------------------------------------------
  async selectProvider() {
    const candidates = PROVIDERS.map((provider) => ({
      provider,
      score: providerPerformanceService.getScore(provider),
      health: providerHealthService.getHealth(provider),
    }));

    // Filter out unhealthy providers
    const healthyProviders = candidates.filter(
      (p) => p.health === "healthy" || p.health === "degraded"
    );

    // If no healthy providers exist, fallback to highest score
    const pool = healthyProviders.length > 0 ? healthyProviders : candidates;

    // Weighted selection based on score
    const totalScore = pool.reduce((sum, p) => sum + p.score, 0);

    // If all scores are zero, pick randomly
    if (totalScore === 0) {
      return pool[Math.floor(Math.random() * pool.length)].provider;
    }

    // Weighted random selection
    let threshold = Math.random() * totalScore;

    for (const p of pool) {
      if (threshold < p.score) {
        return p.provider;
      }
      threshold -= p.score;
    }

    // Fallback (should never hit)
    return pool[0].provider;
  },

  // ---------------------------------------------------------
  // Record provider event (success/failure)
  // ---------------------------------------------------------
  recordEvent(provider, event) {
    // event = { faxId, status, error }

    // Success → boost score + healthy
    if (event.status === "delivered" || event.status === "success") {
      providerPerformanceService.applySuccessBoost(provider);
      providerHealthService.setHealth(provider, "healthy");
    }

    // Failure → penalty + degraded
    if (event.status === "failed" || event.error) {
      providerPerformanceService.applyFailurePenalty(provider);
      providerHealthService.setHealth(provider, "degraded");
    }

    // Could log to Redis or DB here if needed
    return true;
  },
};
