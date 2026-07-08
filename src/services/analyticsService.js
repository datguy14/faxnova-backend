const Fax = require("../models/Fax");
const BillingEvent = require("../models/BillingEvent");
const AuditEvent = require("../models/AuditEvent");

module.exports = {
  async getSystemOverview() {
    const outboundCount = await Fax.countDocuments({ inbound: { isInbound: false } });
    const inboundCount = await Fax.countDocuments({ inbound: { isInbound: true } });

    const deliveredCount = await Fax.countDocuments({ providerStatus: "delivered" });
    const failedCount = await Fax.countDocuments({ providerStatus: "failed" });
    const errorCount = await Fax.countDocuments({ providerStatus: "error" });

    const failoverCount = await Fax.countDocuments({ failoverUsed: true });

    return {
      outboundCount,
      inboundCount,
      deliveredCount,
      failedCount,
      errorCount,
      failoverCount
    };
  },

  async getTenantOverview(tenantId) {
    const outboundCount = await Fax.countDocuments({ tenantId, inbound: { isInbound: false } });
    const inboundCount = await Fax.countDocuments({ tenantId, inbound: { isInbound: true } });

    const deliveredCount = await Fax.countDocuments({ tenantId, providerStatus: "delivered" });
    const failedCount = await Fax.countDocuments({ tenantId, providerStatus: "failed" });
    const errorCount = await Fax.countDocuments({ tenantId, providerStatus: "error" });

    const failoverCount = await Fax.countDocuments({ tenantId, failoverUsed: true });

    const billingEvents = await BillingEvent.find({ tenantId }).sort({ createdAt: -1 }).limit(50);
    const auditEvents = await AuditEvent.find({ tenantId }).sort({ createdAt: -1 }).limit(50);

    return {
      outboundCount,
      inboundCount,
      deliveredCount,
      failedCount,
      errorCount,
      failoverCount,
      billingEvents,
      auditEvents
    };
  }
};
