// src/controllers/webhookController.js

const providerWebhookNormalizer = require("../services/providerWebhookNormalizer");
const idempotencyGuard = require("../services/idempotencyGuard");
const webhookQueue = require("../queues/webhookQueue"); // BullMQ queue

module.exports = {
  async handleWebhook(req, res) {
    try {
      const provider = req.params.provider;
      const payload = req.body;

      const event = providerWebhookNormalizer.normalize(provider, payload);

      // Idempotency check
      const firstTime = await idempotencyGuard.check(event.externalEventId);
      if (!firstTime) {
        return res.status(200).json({ ok: true, duplicate: true });
      }

      // Push to BullMQ for async processing
      await webhookQueue.add("processWebhookEvent", event);

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("Webhook ingestion error:", err);
      return res.status(500).json({ error: err.message });
    }
  },
};
