// src/services/sendFaxService.js — Unified Fax Architecture (CommonJS Only)

const residencyGuard = require("../guards/residencyGuard");
const idempotencyGuard = require("../guards/idempotencyGuard");
const faxStorageService = require("../storage/faxStorageService");
const providerApiService = require("../providers/providerApiService");
const auditService = require("./auditService");
const billingService = require("./billingService");
const Fax = require("../models/Fax");

module.exports = {
  /**
   * Unified outbound fax pipeline.
   * Called by outboundFaxController or outboundFaxQueue worker.
   */
  async sendFax({
    tenantId,
    idempotencyKey,
    to,
    from,
    region,
    provider,
    failoverProvider,
    pdfBuffer,
    metadata = {}
  }) {
    // ----------------------------------------
    // 1. Residency guard
    // ----------------------------------------
    await residencyGuard.ensureOutboundRegion({
      tenantId,
      region
    });

    // ----------------------------------------
    // 2. Idempotency guard
    // ----------------------------------------
    await idempotencyGuard.ensureUnique({
      tenantId,
      faxId: null, // fax not created yet
      idempotencyKey
    });

    // ----------------------------------------
    // 3. Store outbound PDF
    // ----------------------------------------
    const storageResult = await faxStorageService.storeFax({
      tenantId,
      faxId: null,
      buffer: pdfBuffer,
      filename: `outbound_${Date.now()}.pdf`,
      region
    });

    // ----------------------------------------
    // 4. Create unified Fax record (direction: outbound)
    // ----------------------------------------
    const faxRecord = await Fax.create({
      tenantId,
      to,
      from,
      provider,
      failoverProvider,
      region,
      direction: "outbound",
      storageKey: storageResult.storageKey,
      status: "queued",
      metadata,
      createdAt: new Date()
    });

    // ----------------------------------------
    // 5. Send fax via provider API
    // ----------------------------------------
    const providerResult = await providerApiService.sendFax({
      provider,
      to,
      from,
      storageKey: faxRecord.storageKey,
      faxId: faxRecord._id.toString(), // embed internal faxId in metadata
      region
    });

    faxRecord.providerFaxId = providerResult.providerFaxId;
    faxRecord.status = "processing";
    await faxRecord.save();

    // ----------------------------------------
    // 6. Billing hook (outbound send)
    // ----------------------------------------
    await billingService.trackOutboundSend({
      faxId: faxRecord._id
    });

    // ----------------------------------------
    // 7. Audit log
    // ----------------------------------------
    await auditService.logEvent({
      tenantId,
      faxId: faxRecord._id,
      type: "OUTBOUND_FAX_SENT",
      action: "fax_sent",
      provider,
      providerStatus: "queued",
      region,
      details: {
        to,
        from,
        providerFaxId: providerResult.providerFaxId
      }
    });

    // ----------------------------------------
    // 8. Return unified response
    // ----------------------------------------
    return {
      success: true,
      faxId: faxRecord._id,
      provider,
      providerFaxId: providerResult.providerFaxId,
      status: "processing"
    };
  }
};
