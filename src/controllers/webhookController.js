// src/controllers/webhookController.js — Unified Fax Architecture (CommonJS Only)

const webhookService = require("../services/webhookService");
const auditService = require("../services/auditService");
const billingService = require("../services/billingService");
const inboundFaxService = require("../services/inboundFaxService");
const retryFaxService = require("../services/retryFaxService");

const telnyxInboundAdapter = require("../providers/telnyxInboundAdapter");
const sinchInboundAdapter = require("../providers/sinchInboundAdapter");

module.exports = {
  /**
   * Unified webhook entrypoint
   * Handles:
   * - inbound fax
   * - outbound delivery
   * - outbound failure
   * - provider errors
   * - provider receipts
   * - failover triggers
   */
  async handleWebhook(req, res) {
    try {
      const raw = req.body;

      // ---------------------------------------------------------
      // 1. Detect provider
      // ---------------------------------------------------------
      const provider = webhookService.detectProvider(raw);
      if (!provider) {
        await auditService.logEvent({
          type: "WEBHOOK_UNKNOWN_PROVIDER",
          details: { raw }
        });
        return res.status(400).json({ error: "Unknown provider" });
      }

      // ---------------------------------------------------------
      // 2. Normalize payload
      // ---------------------------------------------------------
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

      // ---------------------------------------------------------
      // 3. Log raw + normalized webhook
      // ---------------------------------------------------------
      await auditService.logEvent({
        type: "WEBHOOK_RECEIVED",
        provider,
        providerStatus: normalized.providerStatus,
        faxId: normalized.faxId || null,
        region: normalized.region || null,
        details: {
          raw,
          normalized
        }
      });

      // ---------------------------------------------------------
      // 4. Route by event type
      // ---------------------------------------------------------
      switch (normalized.eventType) {
        case "inbound_fax":
          await inboundFaxService.processInboundFax(normalized);
          break;

        case "outbound_delivered":
        case "outbound_failed":
          await webhookService.updateOutboundStatus(normalized);
          await billingService.trackWebhookEvent({
            faxId: normalized.faxId,
            tenantId: normalized.tenantId,
            provider,
            providerStatus: normalized.providerStatus
          });
          break;

        case "provider_error":
          await webhookService.recordProviderError(normalized);
          break;

        case "delivery_receipt":
          await webhookService.recordDeliveryReceipt(normalized);
          break;

        case "failover_trigger":
          await retryFaxService.enqueueFailoverSend({
            faxId: normalized.faxId,
            failoverProvider: normalized.failoverProvider,
            region: normalized.region
          });
          break;

        default:
          await auditService.logEvent({
            type: "WEBHOOK_UNHANDLED_EVENT",
            provider,
            details: normalized
          });
      }

      // ---------------------------------------------------------
      // 5. Respond OK to provider
      // ---------------------------------------------------------
      res.json({ success: true });
    } catch (err) {
      console.error("WebhookController Error:", err);
      await auditService.logEvent({
        type: "WEBHOOK_CONTROLLER_ERROR",
        details: { error: err.message }
      });
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
};
