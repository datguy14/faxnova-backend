// src/controllers/webhookController.js

const crypto = require("crypto");
const WebhookEvent = require("../models/WebhookEvent");
const webhookQueue = require("../queues/webhookQueue");

function verifyWebhookSignature(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature, "utf8"),
    Buffer.from(expected, "utf8")
  );
}

module.exports = async function webhookController(req, res) {
  const signature = req.headers["x-provider-signature"];
  const secret = process.env.PROVIDER_WEBHOOK_SECRET;

  if (!signature || !verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const event = {
    externalEventId: req.body.eventId,
    provider: req.body.provider,
    faxId: req.body.faxId,
    status: req.body.status,
    providerStatus: req.body.providerStatus,
    errorCode: req.body.errorCode,
    errorMessage: req.body.errorMessage,
    raw: req.body
  };

  // Idempotency check
  const exists = await WebhookEvent.findOne({ externalEventId: event.externalEventId });
  if (exists) {
    return res.status(200).json({ ok: true, duplicate: true });
  }

  // Push to worker queue
  await webhookQueue.add({ events: [event] });

  return res.status(200).json({ ok: true });
};
