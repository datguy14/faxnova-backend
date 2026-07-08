// src/providers/telnyxWebhookAdapter.js
// Telnyx Webhook Adapter — Strict‑Mode

const webhookQueue = require("../queues/webhookQueue");
const signatureGuard = require("../middleware/webhookSignatureGuard");

module.exports = async function telnyxWebhook(req, res) {
  try {
    signatureGuard(req, res, () => {});

    const event = req.body;

    await webhookQueue.add("webhook", {
      provider: "telnyx",
      event
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Telnyx webhook error:", err);
    res.status(400).json({ ok: false, error: err.message });
  }
};
