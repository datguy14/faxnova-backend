// src/workers/webhookWorker.js — Unified Fax Architecture (CommonJS Only)

const webhookQueue = require("../queues/webhookQueue");
const inboundFaxService = require("../services/inboundFaxService");
const webhookService = require("../services/webhookService");
const billingService = require("../services/billingService");
const auditService = require("../services/auditService");
const retryFaxService = require("../services/retryFaxService");

webhookQueue.process(async (job) => {
  const normalized = job.data;

  try {
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
          provider: normalized.provider,
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
          type: "WEBHOOK_WORKER_UNHANDLED_EVENT",
          details: normalized
        });
    }
  } catch (err) {
    await auditService.logEvent({
      type: "WEBHOOK_WORKER_ERROR",
      details: { error: err.message, normalized }
    });
    throw err;
  }
});
