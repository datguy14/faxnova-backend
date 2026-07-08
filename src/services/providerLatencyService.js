const ProviderLatency = require("../models/ProviderLatency");

module.exports = {
  async recordLatency({ provider, faxId, tenantId, latencyMs, region }) {
    try {
      await ProviderLatency.create({
        provider,
        faxId,
        tenantId,
        latencyMs,
        region
      });

      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  async getLatencyMetrics() {
    const telnyx = await ProviderLatency.aggregate([
      { $match: { provider: "telnyx" } },
      { $group: { _id: null, avgLatency: { $avg: "$latencyMs" } } }
    ]);

    const sinch = await ProviderLatency.aggregate([
      { $match: { provider: "sinch" } },
      { $group: { _id: null, avgLatency: { $avg: "$latencyMs" } } }
    ]);

    return {
      telnyxAvgLatency: telnyx[0]?.avgLatency || 0,
      sinchAvgLatency: sinch[0]?.avgLatency || 0
    };
  }
};
