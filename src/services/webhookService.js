// src/services/webhookService.js — Unified Fax Architecture (CommonJS Only)

const Fax = require("../models/Fax");
const auditService = require("./auditService");

/**
 * Detect provider based on webhook payload shape.
 */
function detectProvider(raw) {
  if (!raw) return null;

  // Telnyx webhook structure
  if (raw.data && raw.data.event_type) return "telnyx";

  // Sinch webhook structure
  if (raw.event && raw.message) return "sinch";

  return null;
}

/**
 * Update outbound fax status (delivered, failed, queued, etc.)
 */
async function updateOutboundStatus(normalized) {
  const { faxId, providerStatus, provider, raw } = normalized;

  const fax = await Fax.findById(faxId);
  if (!fax) {
    await auditService.logEvent({
      type: "OUTBOUND_STATUS_UNKNOWN_FAX",
      provider,
      providerStatus,
      details: { normalized }
    });
    return;
  }

  fax.providerStatus = providerStatus;
  fax.lastProviderEvent = raw;
  await fax.save();

  await auditService.logEvent({
    type: "OUTBOUND_STATUS_UPDATED",
    faxId,
    provider,
    providerStatus,
    tenantId: fax.tenantId,
    details: { normalized }
  });
}

/**
 * Record provider error (Sinch or Telnyx)
 */
async function recordProviderError(normalized) {
  const { faxId, provider, providerStatus, raw } = normalized;

  await auditService.logEvent({
    type: "PROVIDER_ERROR",
    faxId,
    provider,
    providerStatus,
    details: { raw, normalized }
  });
}

/**
 * Record delivery receipt (provider-agnostic)
 */
async function recordDeliveryReceipt(normalized) {
  const { faxId, provider, providerStatus, raw } = normalized;

  await auditService.logEvent({
    type: "DELIVERY_RECEIPT",
    faxId,
    provider,
    providerStatus,
    details: { raw, normalized }
  });
}

module.exports = {
  detectProvider,
  updateOutboundStatus,
  recordProviderError,
  recordDeliveryReceipt
};
