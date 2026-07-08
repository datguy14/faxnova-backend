// src/providers/sinchWebhookAdapter.js — Unified Fax Architecture (CommonJS Only)

module.exports = {
  normalize(raw) {
    try {
      const event = raw.event;
      const message = raw.message;

      let eventType = null;

      switch (event) {
        case "fax.delivered":
          eventType = "outbound_delivered";
          break;

        case "fax.failed":
          eventType = "outbound_failed";
          break;

        case "fax.error":
          eventType = "provider_error";
          break;

        case "fax.delivery_receipt":
          eventType = "delivery_receipt";
          break;

        case "fax.failover":
          eventType = "failover_trigger";
          break;

        default:
          return null;
      }

      return {
        eventType,
        provider: "sinch",
        faxId: raw.customerReference || null,
        tenantId: raw.customerReference || null,
        providerStatus: event,
        failoverProvider: raw.failoverProvider || null,
        region: "us",
        raw
      };
    } catch (err) {
      return null;
    }
  }
};
