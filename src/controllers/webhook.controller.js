// src/controllers/webhookController.js

const providerWebhookNormalizer = require("../services/providerWebhookNormalizer");
const providerRoutingEngine = require("../services/providerRoutingEngine");
const providerHealthService = require("../services/providerHealthService");
const providerPerformanceService = require("../services/providerPerformanceService");
const OutboundFax = require("../models/OutboundFax");
const WebhookEvent = require("../models/WebhookEvent");

module.exports = {
  // ---------------------------------------------------------
  // Unified webhook handler for Sinch + Telnyx
  // ---------------------------------------------------------
  async handleWebhook(req, res) {
    try {
      const provider = req.params.provider; // "sinch" or "telnyx"
      const payload = req.body;

      // Normalize provider-specific payload
      const event = providerWebhookNormalizer.normalize(provider, payload);

      // Persist raw webhook event
      await WebhookEvent.create({
        faxId: event.faxId,
        provider: event.provider,
        providerFaxId: event.providerFaxId,
        status: event.status,
        error: event.error,
        raw: event.raw,
      });

      // Update outbound fax record
      if (event.faxId) {
        await OutboundFax.findByIdAndUpdate(event.faxId, {
          status: event.status,
          provider: event.provider,
          providerFaxId: event.providerFaxId,
          error: event.error,
          lastEventAt: new Date(),
        });
      }

      // Update provider performance + health
      if (event.status === "delivered") {
        providerPerformanceService.applySuccessBoost(provider);
        providerHealthService.setHealth(provider, "healthy");
      }

      if (event.status === "failed") {
        providerPerformanceService.applyFailurePenalty(provider);
        providerHealthService.setHealth(provider, "degraded");
      }

      // Notify routing engine of provider event
      providerRoutingEngine.recordEvent(provider, event);

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("Webhook error:", err);
      return res.status(500).json({ error: err.message });
    }
  },
};
