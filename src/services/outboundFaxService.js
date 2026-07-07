// src/services/outboundFaxService.js — Fully Updated, Production‑Ready (CommonJS Only)

const OutboundFax = require("../models/OutboundFax");
const routingService = require("./routingService.v2");
const retryFaxService = require("./retryFaxService");
const idempotencyService = require("./idempotencyService");
const auditService = require("./auditService");
const billingService = require("./billingService");

/**
 * Process an outbound fax request:
 * - residency enforcement
 * - provider routing
 * - idempotency
 * - queue safety
 * - audit logging
 * - billing usage tracking
 */
exports.processOutboundFax = async ({
  to,
  storageKey,
  residencyZone,
  tier,
  region,
  providerOverride,
  tenantId,
  idempotencyKey
}) => {
  // ----------------------------------------
  // 1. Idempotency (prevents duplicate faxes)
  // ----------------------------------------
  if (idempotencyKey) {
    const existing = await idempotencyService.check(idempotencyKey);
    if (existing) {
      return {
        _id: existing.faxId,
        status: existing.status,
        idempotent: true
      };
    }
  }

  // ----------------------------------------
  // 2. Residency enforcement (real logic)
  // ----------------------------------------
  const enforcedRegion = routingService.enforceResidency({
    tenantId,
    residencyZone,
    region
  });

  // ----------------------------------------
  // 3. Provider routing (multi-provider logic)
  // ----------------------------------------
  const { primary, failover } = await routingService.selectProvider({
    residencyZone: enforcedRegion,
    tier,
    region: enforcedRegion,
    providerOverride
  });

  // ----------------------------------------
  // 4. Create fax record
  // ----------------------------------------
  const fax = await OutboundFax.create({
    to,
    provider: primary,
    storageKey,
    region: enforcedRegion,
    tenantId,
    status: "queued",
    failoverProvider: failover || null
  });

  // ----------------------------------------
  // 5. Save idempotency record
  // ----------------------------------------
  if (idempotencyKey) {
    await idempotencyService.record(idempotencyKey, fax._id, fax.status);
  }

  // ----------------------------------------
  // 6. Enqueue initial send job (worker consumes this)
  // ----------------------------------------
  await retryFaxService.enqueueInitialSend({
    faxId: fax._id,
    provider: primary,
    region: enforcedRegion,
    failoverProvider: failover
  });

  // ----------------------------------------
  // 7. Audit logging (required for compliance)
  // ----------------------------------------
  await auditService.logEvent({
    type: "OUTBOUND_FAX_QUEUED",
    faxId: fax._id,
    tenantId,
    provider: primary,
    region: enforcedRegion,
    to
  });

  // ----------------------------------------
  // 8. Billing usage tracking
  // ----------------------------------------
  await billingService.trackOutboundFax({
    tenantId,
    faxId: fax._id,
    provider: primary,
    region: enforcedRegion,
    tier
  });

  // ----------------------------------------
  // 9. Return fax record
  // ----------------------------------------
  return {
    _id: fax._id,
    provider: primary,
    region: enforcedRegion,
    status: fax.status,
    queued: true
  };
};
