const BillingEvent = require("../models/BillingEvent");

module.exports = {
  async trackOutboundFax({ faxId, tenantId, provider, region }) {
    return BillingEvent.create({
      tenantId,
      faxId,
      provider,
      region,
      direction: "outbound",
      eventType: "outbound_send",
      metadata: {}
    });
  },

  async trackInboundFax({ faxId, tenantId, provider, region }) {
    return BillingEvent.create({
      tenantId,
      faxId,
      provider,
      region,
      direction: "inbound",
      eventType: "inbound_received",
      metadata: {}
    });
  },

  async trackWebhookEvent({ faxId, tenantId, provider, providerStatus }) {
    return BillingEvent.create({
      tenantId,
      faxId,
      provider,
      region: "us",
      direction: "webhook",
      eventType: providerStatus,
      metadata: { providerStatus }
    });
  }
};
