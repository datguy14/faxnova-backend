// src/services/webhookService.js — Fully Updated, Production‑Ready (CommonJS Only)

const OutboundFax = require("../models/OutboundFax");
const InboundFax = require("../models/InboundFax");

const telnyxInbound = require("../providers/telnyxInboundAdapter");
const sinchInbound = require("../providers/sinchInboundAdapter");

const idempotencyService = require("./idempotencyService");
const auditService = require("./auditService");

/**
 * Process inbound webhook from Telnyx or Sinch.
 *
 * Responsibilities:
 * - Validate provider signature
 * - Normalize provider payload
 * - Update outbound fax status
 * - Create inbound fax record
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
  // 2. Update outbound fax by providerFaxId
  // ----------------------------------------
  const outbound = await OutboundFax.findOne({ providerFaxId });

  if (outbound) {
    outbound.webhookStatus = providerStatus;
    outbound.webhookRaw = raw;

    // Status mapping
    if (providerStatus === "delivered") outbound.status = "sent";
    if (providerStatus === "failed") outbound.status = "failed";

    await outbound.save();

    // Idempotency update
    await idempotencyService.updateStatus(outbound._id, outbound.status);

    // Audit log
    await auditService.logEvent({
      type: "OUTBOUND_WEBHOOK_UPDATE",
      faxId: outbound._id,
      provider,
      providerStatus,
      region,
      tenantId: outbound.tenantId
    });
  }

  // ----------------------------------------
  // 3. Store inbound fax (delivery receipt or inbound fax)
  // ----------------------------------------
  await InboundFax.create({
    faxId,
    provider,
    providerFaxId,
    providerStatus,
    region,
    raw
  });

  // ----------------------------------------
  // 4. Return normalized webhook for worker
  // ----------------------------------------
  return normalized;
};
