// src/workers/webhookWorker.js — Unified Fax Model (CommonJS Only)

const { Worker } = require("bullmq");
const { connection } = require("../lib/redis");

const webhookService = require("../services/webhookService");
const Fax = require("../models/Fax");
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
      //    This handles inbound fax creation automatically.
      // ----------------------------------------
      const normalized = await webhookService.processWebhook(data);

      const {
        faxId,
        providerStatus,
        provider,
        region,
        providerFaxId,
        raw
      } = normalized;

      // If inbound fax was created inside webhookService,
      // normalized.faxId will be the new inbound faxId.
      const fax = await Fax.findById(faxId);

      if (!fax) {
        throw new Error(`Webhook worker cannot find fax ${faxId}`);
      }

      // ----------------------------------------
      // 2. Update unified Fax record
      // ----------------------------------------
      fax.webhookRaw = raw;
      fax.webhookStatus = providerStatus;

      const statusMap = {
        delivered: "delivered",
        failed: "failed",
        queued: "queued",
        processing: "processing",
        received: "received"
      };

      fax.status = statusMap[providerStatus] || fax.status;

      await fax.save();

      // ----------------------------------------
      // 3. Billing hook
      // ----------------------------------------
      await billingService.trackWebhookEvent({
        faxId,
        tenantId: fax.tenantId,
        provider,
        providerStatus
      });

      // ----------------------------------------
      // 4. Audit log
      // ----------------------------------------
      await auditService.logEvent({
        type: "PROVIDER_WEBHOOK_WORKER_PROCESSED",
        faxId,
        provider,
        providerStatus,
        region,
        tenantId: fax.tenantId,
        details: {
          providerFaxId,
          raw
        }
      });

      // ----------------------------------------
      // 5. Failover trigger (outbound only)
      // ----------------------------------------
      if (
        fax.direction === "outbound" &&
        providerStatus === "failed" &&
        fax.failoverProvider
      ) {
        await retryFaxService.enqueueFailoverSend({
          faxId,
          failoverProvider: fax.failoverProvider,
          region: fax.region
        });

        await auditService.logEvent({
          type: "OUTBOUND_FAX_FAILOVER_TRIGGERED_BY_WORKER",
          faxId,
          provider,
          failoverProvider: fax.failoverProvider,
          region: fax.region,
          tenantId: fax.tenantId
        });
      }

      return { success: true, faxId, providerStatus };
    } catch (err) {
      console.error("Webhook worker error:", err.message);

      await auditService.logEvent({
        type: "WEBHOOK_WORKER_ERROR",
        faxId: data.faxId || null,
        provider: data.provider || null,
        tenantId: data.tenantId || null,
        details: { error: err.message }
      });

      throw err;
    }
  },
  { connection }
);
