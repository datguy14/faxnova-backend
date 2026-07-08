// src/providers/telnyxInboundAdapter.js

module.exports = {
  normalize(raw) {
    try {
      const payload = raw.data?.payload || {};

      return {
        eventType: "inbound_fax",
        provider: "telnyx",
        providerFaxId: payload.fax_id,
        tenantId: payload.tenant_id,
        region: payload.region || "us",
        pdfBuffer: Buffer.from(payload.media || "", "base64"),
        raw
      };
    } catch {
      return null;
    }
  }
};
