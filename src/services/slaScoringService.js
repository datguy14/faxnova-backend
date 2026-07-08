const Fax = require("../models/Fax");
const ProviderLatency = require("../models/ProviderLatency");
const slaConfig = require("../config/slaConfig");

module.exports = {
  async scoreProvider(provider) {
    const recent = await Fax.find({ provider })
      .sort({ createdAt: -1 })
      .limit(slaConfig.evaluationWindow);

    const delivered = recent.filter(f => f.providerStatus === "delivered").length;
    const failed = recent.filter(f => f.providerStatus === "failed").length;
    const errors = recent.filter(f => f.providerStatus === "error").length;

    const total = recent.length || 1;

    const successRate = delivered / total;
    const errorRate = errors / total;

    const latencyAgg = await ProviderLatency.aggregate([
      { $match: { provider } },
      { $group: { _id: null, avgLatency: { $avg: "$latencyMs" } } }
    ]);

    const avgLatency = latencyAgg[0]?.avgLatency || 0;

    return {
      provider,
      successRate,
      errorRate,
      avgLatency,
      sla: {
        successRateOk: successRate >= slaConfig.successRateThreshold,
        errorRateOk: errorRate <= slaConfig.errorRateThreshold,
        latencyOk: avgLatency <= slaConfig.latencyThresholdMs
      }
    };
  }
};
