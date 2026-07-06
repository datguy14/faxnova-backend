// src/controllers/faxController.js

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
