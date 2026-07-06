// src/controllers/faxController.js

const OutboundFax = require("../models/OutboundFax");
const outboundFaxQueue = require("../queues/outboundFaxQueue");

const residencyGuard = require("../guards/residencyGuard");
const idempotencyGuard = require("../guards/idempotencyGuard");

exports.sendFax = async (req, res, next) => {
  try {
    const { to, storageKey, region, provider } = req.body;

    idempotencyGuard.ensureUnique(req);
    residencyGuard.ensureOutboundRegion(region);

    // Persist outbound fax request
    const fax = await OutboundFax.create({
      provider,
      providerFaxId: null, // filled later by worker
      to,
      storageKey,
      region
    });

    // Enqueue job
    await outboundFaxQueue.addOutboundFax({
      provider,
      to,
      storageKey,
      region,
      faxId: fax._id.toString()
    });

    return res.status(200).json({ ok: true, faxId: fax._id });
  } catch (err) {
    next(err);
  }
};
