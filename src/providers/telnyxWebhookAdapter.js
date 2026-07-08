// src/providers/telnyxWebhookAdapter.js — Unified Fax Architecture (CommonJS Only)

module.exports = {
  normalize(raw) {
    try {
      const event = raw.data.event_type;
      const payload = raw.data.payload;

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
        provider: "telnyx",
        faxId: payload.customer_reference || null,
        tenantId: payload.customer_reference || null,
        providerStatus: event,
        failoverProvider: payload.failover_provider || null,
        region: "us",
        raw
      };
    } catch (err) {
      return null;
    }
  }
};
