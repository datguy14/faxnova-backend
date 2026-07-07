// src/workers/webhookWorker.js — Fully Updated, Production‑Ready (CommonJS Only)

const { Worker } = require("bullmq");
const { connection } = require("../lib/redis");

const webhookService = require("../services/webhookService");
const OutboundFax = require("../models/OutboundFax");
const idempotencyService = require("../services/idempotencyService");
const auditService = require("../services/auditService");
const billingService = require("../services/billingService");
const retryFaxService = require("../services/retryFaxService");

module.exports = new Worker(
  "webhookQueue",
  async job => {
    const data = job.data;

    try {
      // ----------------------------------------
      // 1. Process webhook payload (provider → normalized)
      // ----------------------------------------
      const normalized = await webhookService.processWebhook(data);

      const { faxId, providerStatus, provider, raw } = normalized;

      // ----------------------------------------
      // 2. Load fax record
      // ----------------------------------------
      const fax = await OutboundFax.findById(faxId);
      if (!fax) {
        throw new Error(`Webhook received for unknown fax ${faxId}`);
      }

      // ----------------------------------------
      // 3. Save raw webhook payload
      // ----------------------------------------
      fax.webhookRaw = raw;
      fax.webhookStatus = providerStatus;

      // ----------------------------------------
      // 4. Status transitions
      // ----------------------------------------
      if (providerStatus === "delivered") {
        fax.status = "sent";
      }

      if (providerStatus === "failed") {
        fax.status = "failed";
      }

      await fax.save();

      // ----------------------------------------
      // 5. Idempotency update
      // ----------------------------------------
      await idempotencyService.updateStatus(faxId, fax.status);

      // ----------------------------------------
      // 6. Billing hook
      // ----------------------------------------
      await billingService.trackWebhookEvent({
        faxId,
        tenantId: fax.tenantId,
        provider,
        providerStatus
      });

      // ----------------------------------------
      // 7. Audit log
      // ----------------------------------------
      await auditService.logEvent({
        type: "PROVIDER_WEBHOOK_RECEIVED",
        faxId,
        provider,
        providerStatus,
        tenantId: fax.tenantId
      });

      // ----------------------------------------
      // 8. Failover trigger (provider-level failure)
      // ----------------------------------------
      if (providerStatus === "failed" && fax.failoverProvider) {
        await retryFaxService.enqueueFailoverSend({
          faxId,
          failoverProvider: fax.failoverProvider,
          region: fax.region
        });

        await auditService.logEvent({
          type: "OUTBOUND_FAX_FAILOVER_TRIGGERED_BY_WEBHOOK",
          faxId,
          provider,
          failoverProvider: fax.failoverProvider,
          region: fax.region,
          tenantId: fax.tenantId
        });
      }

      return;

    } catch (err) {
      console.error("❌ Webhook worker error:", err.message);

      // ----------------------------------------
      // 9. DLQ routing for corrupted webhooks
      // ----------------------------------------
      await retryFaxService.sendToDLQ({
        faxId: data?.faxId || "unknown",
        provider: data?.provider || "unknown",
        region: data?.region || "unknown",
        reason: err.message
      });

      // Audit log
      await auditService.logEvent({
        type: "WEBHOOK_FAILED",
        faxId: data?.faxId,
        provider: data?.provider,
        error: err.message
      });
    }
  },
  {
    connection,
    concurrency: parseInt(process.env.WEBHOOK_WORKER_CONCURRENCY || "5", 10)
  }
);
