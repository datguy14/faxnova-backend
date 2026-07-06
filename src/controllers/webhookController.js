// src/controllers/webhookController.js

const OutboundFax = require("../models/OutboundFax");

exports.handleWebhook = async (req, res) => {
  try {
    const { providerFaxId, status } = req.body;

    await OutboundFax.updateOne(
      { providerFaxId },
      { status }
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
