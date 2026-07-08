// src/services/webhookService.js — Unified Fax Architecture (CommonJS Only)

const Fax = require("../models/Fax");
const auditService = require("./auditService");

function detectProvider(raw) {
  if (!raw) return null;

  if (raw.data && raw.data.event_type) return "telnyx";
  if (raw.event && raw.message) return "sinch";

  return null;
}

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
