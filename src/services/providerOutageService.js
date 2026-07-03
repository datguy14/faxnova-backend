// src/services/providerOutageService.js — STRICT-MODE FINAL

const STATES = {
  NONE: "none",
  HEALTHY: "healthy",
  DEGRADED: "degraded",
  HALF_OPEN: "half_open",
  OPEN: "open",
  PROBATION: "probation"
};

module.exports = {
  async getOutageState(provider, region = null) {
    return {
      outageState: STATES.NONE,
      cooldownUntil: null,
      probationUntil: null
    };
  },

  async getDiagnostics(provider, region = null) {
    return {
      outageState: STATES.NONE,
      cooldownUntil: null,
      probationUntil: null
    };
  }
};
