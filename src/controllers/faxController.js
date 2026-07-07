// src/controllers/faxController.js — Fully Updated, Production‑Ready (CommonJS Only)

const outboundFaxService = require("../services/outboundFaxService");
const idempotencyService = require("../services/idempotencyService");
const auditService = require("../services/auditService");
const billingService = require("../services/billingService");
const routingService = require("../services/routingService");

exports.createFax = async (req, res) => {
  try {
    const {
      to,
      storageKey,
      residencyZone,
      tier,
      region,
      idempotencyKey
    } = req.body;

    const tenantId = req.tenantId; // added by apiKeyGuard middleware

    // ----------------------------------------
    // 1. Idempotency (prevents duplicate faxes)
    // ----------------------------------------
    if (idempotencyKey) {
      const existing = await idempotencyService.check(idempotencyKey);
      if (existing) {
        return res.status(200).json({
          id: existing.faxId,
          status: existing.status,
          idempotent: true
        });
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
    const provider = routingService.chooseProvider({
      tenantId,
      to,
      region: enforcedRegion,
      tier
    });

    // ----------------------------------------
    // 4. Process outbound fax (your existing logic)
    // ----------------------------------------
    const fax = await outboundFaxService.processOutboundFax({
      to,
      storageKey,
      residencyZone: enforcedRegion,
      tier,
      region: enforcedRegion,
      provider,
      tenantId
    });

    // ----------------------------------------
    // 5. Save idempotency record
    // ----------------------------------------
    if (idempotencyKey) {
      await idempotencyService.record(idempotencyKey, fax._id, fax.status);
    }

    // ----------------------------------------
    // 6. Audit logging (required for compliance)
    // ----------------------------------------
    await auditService.logEvent({
      type: "OUTBOUND_FAX_CREATED",
      faxId: fax._id,
      tenantId,
      provider,
      region: enforcedRegion,
      to
    });

    // ----------------------------------------
    // 7. Billing hook (usage tracking)
    // ----------------------------------------
    await billingService.trackOutboundFax({
      tenantId,
      faxId: fax._id,
      provider,
      region: enforcedRegion,
      tier
    });

    // ----------------------------------------
    // 8. Respond
    // ----------------------------------------
    res.status(202).json({
      id: fax._id,
      provider,
      region: enforcedRegion,
      status: fax.status,
      queued: true
    });

  } catch (err) {
    console.error("❌ Outbound fax error:", err);
    res.status(500).json({ error: err.message });
  }
};
