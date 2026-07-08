// src/providers/sinchInboundAdapter.js — Unified Fax Architecture (CommonJS Only)

module.exports = {
  normalize(raw) {
    try {
      return {
        eventType: "inbound_fax",
        provider: "sinch",
        tenantId: raw.customerReference || null,
        providerFaxId: raw.message.id,
        from: raw.message.from,
        to: raw.message.to,
        region: "us",
        pdfUrl: raw.message.media?.[0]?.url || null,
        raw
      };
    } catch (err) {
      return null;
    }
  }
};
