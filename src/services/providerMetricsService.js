// src/services/providerMetricsService.js — Unified Fax Architecture (CommonJS Only)

const Fax = require("../models/Fax");
const AuditEvent = require("../models/AuditEvent");

module.exports = {
  async getProviderMetrics() {
    const telnyxDelivered = await Fax.countDocuments({
      provider: "telnyx",
      providerStatus: "delivered"
    });

    const telnyxFailed = await Fax.countDocuments({
      provider: "telnyx",
      providerStatus: "failed"
    });

    const telnyxErrors = await Fax.countDocuments({
      provider: "telnyx",
      providerStatus: "error"
    });

    const sinchDelivered = await Fax.countDocuments({
      provider: "sinch",
      providerStatus: "delivered"
    });

    const sinchFailed = await Fax.countDocuments({
      provider: "sinch",
      providerStatus: "failed"
    });

    const sinchErrors = await Fax.countDocuments({
      provider: "sinch",
      providerStatus: "error"
    });

    const telnyxTotal = telnyxDelivered + telnyxFailed + telnyxErrors;
    const sinchTotal = sinchDelivered + sinchFailed + sinchErrors;

    const telnyxSuccessRate = telnyxTotal ? telnyxDelivered / telnyxTotal : 0;
    const sinchSuccessRate = sinchTotal ? sinchDelivered / sinchTotal : 0;

    const failoverEvents = await AuditEvent.countDocuments({
      type: "FAILOVER_TRIGGERED"
    });

    return {
      telnyx: {
        delivered: telnyxDelivered,
        failed: telnyxFailed,
        errors: telnyxErrors,
        total: telnyxTotal,
        successRate: telnyxSuccessRate
      },
      sinch: {
        delivered: sinchDelivered,
        failed: sinchFailed,
        errors: sinchErrors,
        total: sinchTotal,
        successRate: sinchSuccessRate
      },
      failoverEvents
    };
  }
};
