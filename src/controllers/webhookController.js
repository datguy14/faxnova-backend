// src/controllers/webhookController.js — Unified Fax Architecture (CommonJS Only)

const webhookService = require("../services/webhookService");
const telnyxInboundAdapter = require("../providers/telnyxInboundAdapter");
const sinchInboundAdapter = require("../providers/sinchInboundAdapter");
const inboundFaxService = require("../services/inboundFaxService");
const webhookQueue = require("../queues/webhookQueue");
const auditService = require("../services/auditService");

module.exports = {
  async handleWebhook(req, res) {
    try {
      const raw = req.body;

      // Detect provider
      const provider = webhookService.detectProvider(raw);
      if (!provider) {
        await auditService.logEvent({
          type: "WEBHOOK_UNKNOWN_PROVIDER",
          details: { raw }
        });
        return res.status(400).json({ error: "Unknown provider" });
      }

      // Normalize payload
      let normalized;
      if (provider === "telnyx") {
        normalized = telnyxInboundAdapter.normalize(raw);
      } else if (provider === "sinch") {
        normalized = sinchInboundAdapter.normalize(raw);
      }

      if (!normalized) {
        await auditService.logEvent({
          type: "WEBHOOK_NORMALIZATION_FAILED",
          provider,
          details: { raw }
        });
        return res.status(400).json({ error: "Normalization failed" });
      }

      // Route by eventType
      switch (normalized.eventType) {
        case "inbound_fax":
          await inboundFaxService.processInboundFax(normalized);
          break;

        case "outbound_delivered":
        case "outbound_failed":
        case "provider_error":
        case "delivery_receipt":
        case "failover_trigger":
          // Push to webhook worker queue
          await webhookQueue.add("webhookEvent", normalized);
          break;

        default:
          await auditService.logEvent({
            type: "WEBHOOK_UNHANDLED_EVENT",
            provider,
            details: { normalized }
          });
      }

      return res.json({ ok: true });
    } catch (err) {
      await auditService.logEvent({
        type: "WEBHOOK_CONTROLLER_ERROR",
        details: { error: err.message }
      });
      return res.status(500).json({ error: "Webhook error" });
    }
  }
};
