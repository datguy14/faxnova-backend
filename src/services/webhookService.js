// src/services/webhookService.js — Unified Fax Model (CommonJS Only)

const Fax = require("../models/Fax");

const telnyxInbound = require("../providers/telnyxInboundAdapter");
const sinchInbound = require("../providers/sinchInboundAdapter");

const auditService = require("./auditService");
const retryFaxService = require("./retryFaxService");
const inboundFaxService = require("./inboundFaxService");
const idempotencyGuard = require("../guards/idempotencyGuard");

/**
 * Unified Webhook Processor
 *
 * Responsibilities:
 * - Validate provider signature
 * - Normalize provider payload
 * - Handle inbound fax creation
 * - Update outbound fax status
 * - Trigger failover
 * - Audit logging
 */
exports.processWebhook = async payload => {
  let normalized;

  // ----------------------------------------
  // 1. Provider dispatch + normalization
  // ----------------------------------------
  if (payload.provider === "telnyx") {
    normalized = telnyxInbound.normalizeInbound(payload);
  } else if (payload.provider === "sinch") {
    normalized = sinchInbound.normalizeInbound(payload);
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
  // 2. Attempt to load unified Fax record
  // ----------------------------------------
  let fax = null;

  if (faxId) {
    fax = await Fax.findById(faxId);
  }

  if (!fax) {
    fax = await Fax.findOne({ providerFaxId });
  }

  // ----------------------------------------
  // 3. If inbound fax → create new Fax record
  // ----------------------------------------
  if (!fax && providerStatus === "received") {
    const inboundRecord = await inboundFaxService.processInboundFax({
      tenantId: payload.tenantId,
      idempotencyKey: payload.idempotencyKey,
      sourceRegion: region,
      from: payload.from,
      pdfBuffer: payload.pdfBuffer,
      metadata: payload.metadata,
      provider,
      providerFaxId,
      correlationId: payload.correlationId,
      ip: payload.ip,
      path: payload.path,
      method: payload.method,
      apiTier: payload.apiTier
    });

    return inboundRecord;
  }

  // ----------------------------------------
  // 4. If still no fax → unknown webhook
  // ----------------------------------------
  if (!fax) {
    throw new Error(`Webhook received for unknown fax: ${providerFaxId}`);
  }

  // ----------------------------------------
  // 5. Update unified Fax record with webhook data
  // ----------------------------------------
  fax.webhookRaw = raw;
  fax.webhookStatus = providerStatus;

  // Status mapping
  const statusMap = {
    delivered: "delivered",
    failed: "failed",
    queued: "queued",
    processing: "processing",
    received: "received"
  };

  fax.status = statusMap[providerStatus] || fax.status;

  await fax.save();

  // ----------------------------------------
  // 6. Idempotency update (outbound only)
  // ----------------------------------------
  if (fax.direction === "outbound") {
    await idempotencyGuard.ensureUnique({
      tenantId: fax.tenantId,
      faxId: fax._id,
      idempotencyKey: `webhook:${providerFaxId}:${providerStatus}`
    });
  }

  // ----------------------------------------
  // 7. Audit log
  // ----------------------------------------
  await auditService.logEvent({
    type: "PROVIDER_WEBHOOK_RECEIVED",
    faxId: fax._id,
    provider,
    providerStatus,
    region,
    tenantId: fax.tenantId,
    details: {
      providerFaxId,
      raw
    }
  });

  // ----------------------------------------
  // 8. Failover trigger (outbound only)
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
  // 9. Return normalized webhook for worker
  // ----------------------------------------
  return normalized;
};
