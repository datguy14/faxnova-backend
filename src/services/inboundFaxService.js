// src/services/inboundFaxService.js — Unified Fax Model (CommonJS Only)

const faxStorageService = require("../storage/faxStorageService");
const residencyGuard = require("../guards/residencyGuard");
const idempotencyGuard = require("../guards/idempotencyGuard");
const auditService = require("./auditService");
const Fax = require("../models/Fax");

module.exports = {
  /**
   * Main inbound fax pipeline.
   * Called by webhookController when a provider notifies us of an inbound fax.
   */
  async processInboundFax({
    tenantId,
    idempotencyKey,
    sourceRegion,
    from,
    pdfBuffer,
    metadata = {},
    provider,
    providerFaxId,
    correlationId,
    ip,
    path,
    method,
    apiTier
  }) {
    // ----------------------------------------
    // 1. Residency guard
    // ----------------------------------------
    await residencyGuard.ensureInboundRegion({
      tenantId,
      region: sourceRegion
    });

    // ----------------------------------------
    // 2. Idempotency guard
    // ----------------------------------------
    await idempotencyGuard.ensureUnique({
      tenantId,
      faxId: null, // faxId not known yet
      idempotencyKey
    });

    // ----------------------------------------
    // 3. Store inbound PDF
    // ----------------------------------------
    const storageResult = await faxStorageService.storeFax({
      tenantId,
      faxId: null,
      buffer: pdfBuffer,
      filename: `inbound_${Date.now()}.pdf`,
      region: sourceRegion
    });

    // ----------------------------------------
    // 4. Create unified Fax record (direction: inbound)
    // ----------------------------------------
    const faxRecord = await Fax.create({
      tenantId,
      from,
      provider,
      providerFaxId,
      region: sourceRegion,
      direction: "inbound",
      storageKey: storageResult.storageKey,
      status: "received",
      metadata,
      createdAt: new Date()
    });

    // ----------------------------------------
    // 5. Audit event
    // ----------------------------------------
    await auditService.logEvent({
      tenantId,
      faxId: faxRecord._id,
      type: "INBOUND_FAX_RECEIVED",
      action: "fax_received",
      provider,
      providerStatus: "received",
      region: sourceRegion,
      details: {
        from,
        providerFaxId,
        correlationId,
        ip,
        path,
        method,
        apiTier
      }
    });

    // ----------------------------------------
    // 6. Return unified response
    // ----------------------------------------
    return {
      success: true,
      faxId: faxRecord._id,
      status: "received",
      provider,
      providerFaxId,
      correlationId
    };
  }
};
