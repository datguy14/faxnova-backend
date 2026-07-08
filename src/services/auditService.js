// src/services/auditService.js — Unified Fax Architecture (CommonJS Only)

const FaxEvent = require("../models/FaxEvent");

module.exports = {
  /**
   * Unified audit logger.
   * Every service in FaxNova logs through this.
   */
  async logEvent({
    tenantId,
    faxId = null,
    type,
    action = null,
    provider = null,
    providerStatus = null,
    region = null,
    details = {}
  }) {
    try {
      await FaxEvent.create({
        tenantId,
        faxId,
        type,
        action,
        provider,
        providerStatus,
        region,
        details,
        timestamp: new Date()
      });
    } catch (err) {
      console.error("AuditService error:", err.message);
    }
  }
};
