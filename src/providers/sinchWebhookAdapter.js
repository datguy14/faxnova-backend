// src/providers/sinchWebhookAdapter.js
// Sinch Webhook Adapter — Strict‑Mode

const webhookQueue = require("../queues/webhookQueue");
const signatureGuard = require("../middleware/webhookSignatureGuard");

module.exports = async function sinchWebhook(req, res) {
  try {
    signatureGuard(req, res, () => {});

    const event = req.body;

    await webhookQueue.add("webhook", {
      provider: "sinch",
      event
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Sinch webhook error:", err);
    res.status(400).json({ ok: false, error: err.message });
  }
};
