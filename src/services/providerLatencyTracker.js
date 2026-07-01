// src/services/providerLatencyTracker.js

const LATENCY_WINDOW = 50; // last 50 samples
const EWMA_ALPHA = 0.3;    // smoothing factor

const latencyData = {
  sinch: { samples: [], ewma: null },
  telnyx: { samples: [], ewma: null },
};

module.exports = {
  recordLatency(provider, ms) {
    const data = latencyData[provider];

    // Rolling window
    data.samples.push(ms);
    if (data.samples.length > LATENCY_WINDOW) {
      data.samples.shift();
    }

    // EWMA smoothing
    if (data.ewma === null) {
      data.ewma = ms;
    } else {
      data.ewma = EWMA_ALPHA * ms + (1 - EWMA_ALPHA) * data.ewma;
    }
  },

  async getLatency(provider) {
    const data = latencyData[provider];
    const samples = [...data.samples];

    if (!samples.length) {
      return {
        p95: 0,
        p99: 0,
        ewma: 0,
        value: 0, // routing-safe numeric latency
      };
    }

    samples.sort((a, b) => a - b);

    const p95 = samples[Math.floor(samples.length * 0.95)];
    const p99 = samples[Math.floor(samples.length * 0.99)];

    return {
      p95,
      p99,
      ewma: data.ewma,
      value: data.ewma, // routing engine uses this
    };
  },
};
