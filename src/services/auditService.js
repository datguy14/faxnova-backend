const AuditEvent = require("../models/AuditEvent");

module.exports = {
  async logEvent({ type, faxId = null, tenantId = null, provider = null, region = null, details = {} }) {
    try {
      return AuditEvent.create({
        type,
        faxId,
        tenantId,
        provider,
        region,
        details
      });
    } catch (err) {
      console.error("Audit logging failed:", err.message);
    }
  }
};
