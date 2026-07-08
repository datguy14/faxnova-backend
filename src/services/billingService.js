// src/services/billingService.js — Unified Fax Architecture (CommonJS Only)

const auditService = require("./auditService");

module.exports = {
  async trackInboundFax({ faxId, tenantId, provider, region }) {
    await auditService.logEvent({
      type: "BILLING_INBOUND_FAX",
      faxId,
      tenantId,
      provider,
      region
    });
  },

  async trackWebhookEvent({ faxId, tenantId, provider, providerStatus }) {
    await auditService.logEvent({
      type: "BILLING_WEBHOOK_EVENT",
      faxId,
      tenantId,
      provider,
      providerStatus
    });
  }
};
