// src/providers/sinchInboundAdapter.js — Unified Fax Architecture (CommonJS Only)

module.exports = {
  normalize(raw) {
    try {
      return {
        provider: "sinch",
        providerFaxId: raw.message?.id || null,
        faxId: raw.message?.clientReference || null,
        tenantId: raw.message?.tenantId || null,
        region: raw.message?.region || "us",

        providerStatus: raw.message?.status || null,

        eventType: (() => {
          switch (raw.event) {
            case "inbound_fax":
              return "inbound_fax";
            case "delivery_report":
              return "delivery_receipt";
            case "error":
              return "provider_error";
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
