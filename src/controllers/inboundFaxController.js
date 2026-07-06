// src/controllers/inboundFaxController.js

const InboundFax = require("../models/InboundFax");

exports.receiveInboundFax = async (req, res) => {
  try {
    const fax = await InboundFax.create({
      from: req.body.from,
      provider: req.body.provider,
      providerFaxId: req.body.providerFaxId,
      storageKey: req.body.storageKey,
      region: req.body.region,
      status: req.body.status || "received"
    });

    res.json(fax);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
