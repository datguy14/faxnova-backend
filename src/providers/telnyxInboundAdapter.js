// src/providers/telnyxInboundAdapter.js — Unified Fax Architecture (CommonJS Only)

module.exports = {
  normalize(raw) {
    try {
      const data = raw.data;

      return {
        eventType: "inbound_fax",
        provider: "telnyx",
        tenantId: data.payload.customer_reference || null,
        providerFaxId: data.payload.fax_id,
        from: data.payload.from,
        to: data.payload.to,
        region: "us",
        pdfUrl: data.payload.media_url,
        raw
      };
    } catch (err) {
      return null;
    }
  }
};
