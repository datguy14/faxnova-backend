// src/services/inboundFaxService.js — Unified Fax Architecture (CommonJS Only)

const InboundFax = require("../models/InboundFax");
const faxStorageService = require("../storage/faxStorageService");
const auditService = require("./auditService");
const billingService = require("./billingService");

module.exports = {
  async processInboundFax(normalized) {
    const {
      tenantId,
      provider,
      providerFaxId,
      region,
      pdfBuffer,
      raw
    } = normalized;

    // ---------------------------------------------------------
    // 1. Store inbound PDF
    // ---------------------------------------------------------
    const storageResult = await faxStorageService.storeFax({
      tenantId,
      faxId: providerFaxId,
      buffer: pdfBuffer,
      filename: `inbound_${providerFaxId}.pdf`,
      region
    });

    // ---------------------------------------------------------
    // 2. Create inbound fax record
    // ---------------------------------------------------------
    const fax = await InboundFax.create({
      tenantId,
      provider,
      providerFaxId,
      region,
      direction: "inbound",
      storageKey: storageResult.storageKey,
      status: "received",
      rawInbound: raw
    });

    // ---------------------------------------------------------
    // 3. Audit logging
    // ---------------------------------------------------------
    await auditService.logEvent({
      type: "INBOUND_FAX_RECEIVED",
      faxId: fax._id,
      tenantId,
      provider,
      region,
      details: normalized
    });

    // ---------------------------------------------------------
    // 4. Billing
    // ---------------------------------------------------------
    await billingService.trackInboundFax({
      faxId: fax._id,
      tenantId,
      provider,
      region
    });

    return fax;
  }
};
