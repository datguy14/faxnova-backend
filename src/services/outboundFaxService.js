// src/services/outboundFaxService.js — Unified Fax Architecture (CommonJS Only)

const OutboundFax = require("../models/OutboundFax");
const routingService = require("./routingService.v2");
const outboundFaxQueue = require("../queues/outboundFaxQueue");
const idempotencyService = require("./idempotencyService");
const auditService = require("./auditService");
const billingService = require("./billingService");

/**
 * Unified outbound fax pipeline:
 * - residency enforcement
 * - provider routing
 * - idempotency
 * - queue safety
 * - audit logging
 * - billing usage tracking
 */
module.exports = {
  async processOutboundFax({
    to,
    storageKey,
    residencyZone,
    tier,
    region,
    providerOverride,
    tenantId,
    idempotencyKey
  }) {
    // ---------------------------------------------------------
    // 1. Idempotency (prevents duplicate faxes)
    // ---------------------------------------------------------
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

    // ---------------------------------------------------------
    // 2. Residency enforcement
    // ---------------------------------------------------------
    const enforcedRegion = routingService.enforceResidency({
      tenantId,
      residencyZone,
      region
    });

    // ---------------------------------------------------------
    // 3. Provider routing (primary + failover)
    // ---------------------------------------------------------
    const { primary, failover } = await routingService.selectProvider({
      residencyZone: enforcedRegion,
      tier,
      region: enforcedRegion,
      providerOverride
    });

    // ---------------------------------------------------------
    // 4. Create outbound fax record
    // ---------------------------------------------------------
    const fax = await OutboundFax.create({
      to,
      provider: primary,
      storageKey,
      region: enforcedRegion,
      tenantId,
      status: "queued",
      failoverProvider: failover || null
    });

    // ---------------------------------------------------------
    // 5. Save idempotency record
    // ---------------------------------------------------------
    if (idempotencyKey) {
      await idempotencyService.record(idempotencyKey, fax._id, fax.status);
    }

    // ---------------------------------------------------------
    // 6. Enqueue initial outbound send job
    // ---------------------------------------------------------
    await outboundFaxQueue.add("sendFax", {
      tenantId,
      faxId: fax._id,
      provider: primary,
      region: enforcedRegion,
      failoverProvider: failover || null,
      idempotencyKey,
      to,
      storageKey,
      pdfBuffer: null // worker loads from storageKey
    });

    // ---------------------------------------------------------
    // 7. Audit logging
    // ---------------------------------------------------------
    await auditService.logEvent({
      type: "OUTBOUND_FAX_QUEUED",
      faxId: fax._id,
      tenantId,
      provider: primary,
      region: enforcedRegion,
      to
    });

    // ---------------------------------------------------------
    // 8. Billing usage tracking
    // ---------------------------------------------------------
    await billingService.trackOutboundFax({
      tenantId,
      faxId: fax._id,
      provider: primary,
      region: enforcedRegion,
      tier
    });

    // ---------------------------------------------------------
    // 9. Return fax record
    // ---------------------------------------------------------
    return {
      _id: fax._id,
      provider: primary,
      region: enforcedRegion,
      status: fax.status,
      queued: true
    };
  }
};
