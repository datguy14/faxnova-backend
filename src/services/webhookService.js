// src/services/webhookService.js — Updated for Unified Fax Model (CommonJS Only)

const Fax = require("../models/Fax");

const telnyxInbound = require("../providers/telnyxInboundAdapter");
const sinchInbound = require("../providers/sinchInboundAdapter");

const idempotencyService = require("./idempotencyService");
const auditService = require("./auditService");
const retryFaxService = require("./retryFaxService");

/**
 * Process inbound webhook from Telnyx or Sinch.
 *
 * Responsibilities:
 * - Validate provider signature
 * - Normalize provider payload
 * - Update unified Fax record (inbound + outbound)
 * - Trigger failover if outbound failed
 * - Update idempotency state
 * - Audit logging
 */
exports.processWebhook = async payload => {
  let normalized;

  // ----------------------------------------
  // 1. Provider dispatch + normalization
  // ----------------------------------------
  if (payload.provider === "telnyx") {
    normalized = await telnyxInbound.normalizeInbound(payload);
  } else if (payload.provider === "sinch") {
    normalized = await sinchInbound.normalizeInbound(payload);
  } else {
    throw new Error("Unknown provider webhook");
  }

  const {
    faxId,
    providerFaxId,
    provider,
    providerStatus,
    region,
    raw
  } = normalized;

  // ----------------------------------------
  // 2. Load unified Fax record
  //    Prefer internal faxId → fallback to providerFaxId
  // ----------------------------------------
  let fax = null;

  if (faxId) {
    fax = await Fax.findById(faxId);
  }

  if (!fax) {
    fax = await Fax.findOne({ providerFaxId });
  }

  if (!fax) {
    throw new Error(`Webhook received for unknown fax: ${providerFaxId}`);
  }

  // ----------------------------------------
  // 3. Update unified Fax record with webhook data
  // ----------------------------------------
  fax.webhookRaw = raw;
  fax.webhookStatus = providerStatus;

  // Status mapping
  if (providerStatus === "delivered") fax.status = "delivered";
  if (providerStatus === "failed") fax.status = "failed";
  if (providerStatus === "queued") fax.status = "queued";
  if (providerStatus === "processing") fax.status = "processing";

  await fax.save();

  // ----------------------------------------
  // 4. Idempotency update
  // ----------------------------------------
  await idempotencyService.updateStatus(fax._id, fax.status);

  // ----------------------------------------
  // 5. Audit log
  // ----------------------------------------
  await auditService.logEvent({
    type: "PROVIDER_WEBHOOK_RECEIVED",
    faxId: fax._id,
    provider,
    providerStatus,
    region,
    tenantId: fax.tenantId
  });

  // ----------------------------------------
  // 6. Failover trigger (outbound only)
  // ----------------------------------------
  if (
    fax.direction === "outbound" &&
    providerStatus === "failed" &&
    fax.failoverProvider
  ) {
    await retryFaxService.enqueueFailoverSend({
      faxId: fax._id,
      failoverProvider: fax.failoverProvider,
      region: fax.region
    });

    await auditService.logEvent({
      type: "OUTBOUND_FAX_FAILOVER_TRIGGERED_BY_WEBHOOK",
      faxId: fax._id,
      provider,
      failoverProvider: fax.failoverProvider,
      region: fax.region,
      tenantId: fax.tenantId
    });
  }

  // ----------------------------------------
  // 7. Return normalized webhook for worker
  // ----------------------------------------
  return normalized;
};
