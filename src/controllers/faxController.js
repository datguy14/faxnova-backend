// src/controllers/faxController.js

const outboundFaxQueue = require("../queues/outboundFaxQueue");
const residencyGuard = require("../guards/residencyGuard");
const idempotencyGuard = require("../guards/idempotencyGuard");

/**
 * Fax Controller — Strict‑Mode Edition
 *
 * Outbound fax submission:
 * - idempotency guard
 * - residency guard
 * - enqueue outbound fax job
 */

exports.sendFax = async (req, res, next) => {
  try {
    const { to, storageKey, region, provider } = req.body;

    idempotencyGuard.ensureUnique(req);
    residencyGuard.ensureOutboundRegion(region);

    await outboundFaxQueue.addOutboundFax({
      provider,
      to,
      storageKey,
      region
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
};
