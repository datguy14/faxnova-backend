// src/providers/telnyxInboundAdapter.js — Unified Fax Architecture (CommonJS Only)

module.exports = {
  normalize(raw) {
    try {
      const data = raw.data || {};

      return {
        provider: "telnyx",
        providerFaxId: data.payload?.fax_id || null,
        faxId: data.payload?.client_reference || null,
        tenantId: data.payload?.tenant_id || null,
        region: data.payload?.region || "us",

        providerStatus: data.payload?.status || null,

        eventType: (() => {
          switch (data.event_type) {
            case "fax.received":
              return "inbound_fax";
            case "fax.delivered":
              return "outbound_delivered";
            case "fax.failed":
              return "outbound_failed";
            default:
              return "provider_error";
          }
        })(),

        raw
      };
    } catch (err) {
      return null;
    }
  }
};
