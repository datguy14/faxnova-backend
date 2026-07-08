// src/services/inboundFaxService.js — Unified Fax Architecture (CommonJS Only)

const Fax = require("../models/Fax");
const auditService = require("./auditService");
const billingService = require("./billingService");

module.exports = {
  async processInboundFax(normalized) {
    const {
      tenantId,
      provider,
      providerFaxId,
      region,
      raw
    } = normalized;

    const fax = new Fax({
      tenantId,
      provider,
      providerFaxId,
      direction: "inbound",
      region,
      providerStatus: "received",
      rawInbound: raw,
      timestamp: new Date()
    });

    await fax.save();

    await auditService.logEvent({
      type: "INBOUND_FAX_RECEIVED",
      faxId: fax._id,
      tenantId,
      provider,
      region,
      details: normalized
    });

    await billingService.trackInboundFax({
      faxId: fax._id,
      tenantId,
      provider,
      region
    });

    return fax;
  }
};
