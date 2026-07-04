// src/services/outboundFaxService.js

const faxStorageService = require("./faxStorageService");
const providerApiService = require("./providerApiService");
const dataResidencyGuard = require("./dataResidencyGuard");
const idempotencyGuard = require("./idempotencyGuard");
const audit = require("../audit/auditService");
const Fax = require("../models/Fax");

module.exports = {
  /**
   * Main outbound fax pipeline.
   */
  async sendOutboundFax({
    tenantId,
    idempotencyKey,
    targetRegion,
    to,
    pdfBuffer,
    metadata,
    correlationId,
    ip,
    path,
    method,
    apiTier
  }) {
    // 1. Residency guard
    await dataResidencyGuard.enforceOutboundResidency({
      tenantId,
      targetRegion
    });

    // 2. Idempotency guard
    await idempotencyGuard.check({
      tenantId,
      idempotencyKey
    });

    // 3. Store PDF
    const storageResult = await faxStorageService.storeOutboundFax({
      tenantId,
      pdfBuffer
    });

    // 4. Create fax record
    const faxRecord = await Fax.create({
      tenantId,
      to,
      region: targetRegion,
      storageKey: storageResult.storageKey,
      status: "queued",
      metadata,
      createdAt: new Date()
    });

    // 5. Send fax via provider
    const providerResult = await providerApiService.sendFax({
      tenantId,
      to,
      pdfUrl: storageResult.url,
      region: targetRegion,
      faxId: faxRecord._id
    });

    // 6. Update fax record with provider response
    faxRecord.status = providerResult.status;
    faxRecord.provider = providerResult.provider;
    faxRecord.providerMessageId = providerResult.messageId;
    faxRecord.updatedAt = new Date();
    await faxRecord.save();

    // 7. Audit event
    audit.logEvent({
      tenantId,
      type: "fax_outbound",
      action: "fax_sent",
      correlationId,
      ip,
      path,
      method,
      tier: apiTier,
      details: {
        faxId: faxRecord._id,
        provider: providerResult.provider,
        region: targetRegion,
        to
      }
    });

    return {
      success: true,
      faxId: faxRecord._id,
      provider: providerResult.provider,
      status: providerResult.status,
      correlationId
    };
  }
};
