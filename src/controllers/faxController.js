// src/controllers/faxController.js — Strict‑Mode CommonJS Version

const OutboundFax = require("../models/OutboundFax");

exports.createFax = async (req, res) => {
  try {
    const fax = await OutboundFax.create({
      to: req.body.to,
      provider: req.body.provider,
      storageKey: req.body.storageKey,
      region: req.body.region
    });

    res.json(fax);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFaxById = async (req, res) => {
  try {
    const fax = await OutboundFax.findById(req.params.id);
    if (!fax) return res.status(404).json({ error: "Fax not found" });

    res.json(fax);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
