// src/services/providerScoreCache.js — REDIS VERSION
const redis = require("../lib/redis");

const CACHE_TTL = 30; // 30 seconds

module.exports = {
  async getScores() {
    const cached = await redis.get("providerScores");
    if (cached) return JSON.parse(cached);
    
    const scores = {
      sinch: await providerPerformanceService.getScore('sinch'),
      telnyx: await providerPerformanceService.getScore('telnyx')
    };
    
    await redis.setex("providerScores", CACHE_TTL, JSON.stringify(scores));
    return scores;
  },
  
  async getBestProvider(region) {
    const scores = await this.getScores();
    // Apply region weighting...
    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    return best;
  }
};
