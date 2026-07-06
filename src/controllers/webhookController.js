// src/controllers/webhookController.js

const webhookService = require("../services/webhookService");

exports.handleWebhook = async (req, res) => {
  try {
    await webhookService.processWebhook(req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
