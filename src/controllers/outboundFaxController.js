// src/controllers/outboundFaxController.js

const OutboundFax = require("../models/OutboundFax");

exports.getOutboundFax = async (req, res) => {
  try {
    const fax = await OutboundFax.findById(req.params.id);
    if (!fax) return res.status(404).json({ error: "Fax not found" });

    res.json(fax);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
