// src/controllers/faxController.js — Strict‑Mode CommonJS Version

const OutboundFax = require("../models/OutboundFax");
const outboundFaxService = require("../services/outboundFaxService");
const routingService = require("../services/routingService.v2");

exports.createFax = async (req, res) => {
  try {
    const { to, storageKey, residencyZone, tier, region } = req.body;

    // 1. Select provider using routingService.v2
    const { primary } = await routingService.selectProvider({
      residencyZone,
      tier,
      region
    });

    // 2. Create outbound fax record
    const fax = await OutboundFax.create({
      to,
      provider: primary,
      storageKey,
      region
    });

    // 3. Hand off to outbound fax service (queues, workers)
    await outboundFaxService.enqueueOutboundFax(fax);

    res.json(fax);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
