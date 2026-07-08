// src/services/sendFaxService.js — Unified Fax Architecture (CommonJS Only)

const OutboundFax = require("../models/OutboundFax");
const faxStorageService = require("../storage/faxStorageService");
const providerApiService = require("../providers/providerApiService");
const auditService = require("./auditService");
const billingService = require("./billingService");

module.exports = {
  /**
   * Unified outbound fax send pipeline.
   * Called ONLY by outboundFaxWorker.
   *
   * Responsibilities:
   * - load PDF from storageKey
   * - send via provider API
   * - update OutboundFax record
   * - audit + billing
   */
  async sendFax({
    faxId,
    tenantId,
    provider,
    region,
    storageKey,
    idempotencyKey,
    to
  }) {
    // ---------------------------------------------------------
    // 1. Load outbound fax record
    // ---------------------------------------------------------
    const fax = await OutboundFax.findById(faxId);
    if (!fax) {
      throw new Error(`sendFaxService: Fax not found: ${faxId}`);
    }

    // ---------------------------------------------------------
    // 2. Load PDF from storage
    // ---------------------------------------------------------
    const pdfBuffer = await faxStorageService.loadFax(storageKey);
    if (!pdfBuffer) {
      throw new Error(`sendFaxService: Failed to load PDF for ${faxId}`);
    }

    // ---------------------------------------------------------
    // 3. Send fax via provider API
    // ---------------------------------------------------------
    const providerResult = await providerApiService.sendFax({
      provider,
      to,
      storageKey,
      buffer: pdfBuffer,
      faxId: faxId.toString(),
      region
    });

    // ---------------------------------------------------------
    // 4. Update fax record
    // ---------------------------------------------------------
    fax.providerFaxId = providerResult.providerFaxId;
    fax.status = "processing";
    await fax.save();

    // ---------------------------------------------------------
    // 5. Billing hook (outbound send)
    // ---------------------------------------------------------
    await billingService.trackOutboundSend({
      faxId
    });

    // ---------------------------------------------------------
    // 6. Audit log
    // ---------------------------------------------------------
    await auditService.logEvent({
      tenantId,
      faxId,
      type: "OUTBOUND_FAX_SENT",
      provider,
      providerStatus: "queued",
      region,
      details: {
        to,
        providerFaxId: providerResult.providerFaxId,
        storageKey
      }
    });

    // ---------------------------------------------------------
    // 7. Unified response
    // ---------------------------------------------------------
    return {
      success: true,
      faxId,
      provider,
      providerFaxId: providerResult.providerFaxId,
      status: "processing"
    };
  }
};
