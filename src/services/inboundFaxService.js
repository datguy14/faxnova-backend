// src/services/inboundFaxService.js

const faxStorageService = require("./faxStorageService");
const dataResidencyGuard = require("./dataResidencyGuard");
const idempotencyGuard = require("./idempotencyGuard");
const audit = require("../audit/auditService");
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
    metadata,
    correlationId,
    ip,
    path,
    method,
    apiTier
  }) {
    // 1. Residency guard
    await dataResidencyGuard.enforceInboundResidency({
      tenantId,
      sourceRegion
    });

    // 2. Idempotency guard (optional but recommended)
    await idempotencyGuard.check({
      tenantId,
      idempotencyKey
    });

    // 3. Store inbound PDF
    const storageResult = await faxStorageService.storeInboundFax({
      tenantId,
      pdfBuffer
    });

    // 4. Create fax record
    const faxRecord = await Fax.create({
      tenantId,
      from,
      region: sourceRegion,
      direction: "inbound",
      storageKey: storageResult.storageKey,
      status: "received",
      metadata,
      createdAt: new Date()
    });

    // 5. Audit event
    audit.logEvent({
      tenantId,
      type: "fax_inbound",
      action: "fax_received",
      correlationId,
      ip,
      path,
      method,
      tier: apiTier,
      details: {
        faxId: faxRecord._id,
        region: sourceRegion,
        from
      }
    });

    return {
      success: true,
      faxId: faxRecord._id,
      status: "received",
      correlationId
    };
  }
};
