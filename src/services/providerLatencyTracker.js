// src/services/providerLatencyTracker.js

const redis = require("../lib/redis");

const PROVIDERS = ["sinch", "telnyx"];

// Redis keys
const EWMA_KEY = "faxnova:latency:ewma";
const HIST_KEY = "faxnova:latency:hist";

// EWMA smoothing factor
// Higher alpha = more reactive, lower alpha = more stable
const ALPHA = 0.3;

// Max history size per provider (for p95/p99)
const MAX_HISTORY = 200;

module.exports = {
  async recordLatency(provider, ms) {
    if (!PROVIDERS.includes(provider)) return;

    // --- EWMA Update ---
    const prevRaw = await redis.hget(EWMA_KEY, provider);
    const prev = prevRaw ? Number(prevRaw) : ms;

    const ewma = ALPHA * ms + (1 - ALPHA) * prev;
    await redis.hset(EWMA_KEY, provider, ewma);

    // --- History Update (for p95/p99) ---
    const score = Date.now(); // sorted set score
    await redis.zadd(`${HIST_KEY}:${provider}`, score, ms.toString());

    // Trim history to MAX_HISTORY
    await redis.zremrangebyrank(`${HIST_KEY}:${provider}`, 0, -MAX_HISTORY - 1);

    return ewma;
  },

  async getLatency(provider) {
    const raw = await redis.hget(EWMA_KEY, provider);
    return raw ? Number(raw) : 0;
  },

  async getPercentiles(provider) {
    const key = `${HIST_KEY}:${provider}`;

    const values = await redis.zrange(key, 0, -1);
    if (values.length === 0) {
      return { p95: 0, p99: 0 };
    }

    const sorted = values.map(Number).sort((a, b) => a - b);

    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    return {
      p95: sorted[p95Index] || sorted[sorted.length - 1],
      p99: sorted[p99Index] || sorted[sorted.length - 1]
    };
  },

  async getDiagnostics(provider) {
    const ewma = await this.getLatency(provider);
    const { p95, p99 } = await this.getPercentiles(provider);

    return {
      provider,
      ewma,
      p95,
      p99
    };
  }
};
