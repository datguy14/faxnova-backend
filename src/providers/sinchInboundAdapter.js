// src/providers/sinchInboundAdapter.js

module.exports = {
  normalize(raw) {
    try {
      return {
        eventType: "inbound_fax",
        provider: "sinch",
        providerFaxId: raw.message?.id,
        tenantId: raw.message?.tenantId,
        region: raw.message?.region || "us",
        pdfBuffer: Buffer.from(raw.message?.media || "", "base64"),
        raw
      };
    } catch {
      return null;
    }
  }
};
