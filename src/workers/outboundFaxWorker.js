// src/workers/outboundFaxWorker.js — Fully Updated, Production‑Ready (CommonJS Only)

const { Worker } = require("bullmq");
const { connection } = require("../lib/redis");

const OutboundFax = require("../models/OutboundFax");
const sendFaxService = require("../services/sendFaxService");
const retryFaxService = require("../services/retryFaxService");
const idempotencyService = require("../services/idempotencyService");
const auditService = require("../services/auditService");

module.exports = new Worker(
  "outboundFaxQueue",
  async job => {
    const { faxId, provider, region, failoverProvider } = job.data;

    try {
      // ----------------------------------------
      // 1. Load fax record
      // ----------------------------------------
      const fax = await OutboundFax.findById(faxId);
      if (!fax) {
        throw new Error(`Fax ${faxId} not found`);
      }

      // ----------------------------------------
      // 2. Update status → processing
      // ----------------------------------------
      fax.status = "processing";
      await fax.save();

      // ----------------------------------------
      // 3. Attempt provider send
      // ----------------------------------------
      const result = await sendFaxService.sendFax({
        faxId,
        provider,
        region,
        storageKey: fax.storageKey,
        to: fax.to
      });

      // ----------------------------------------
      // 4. Provider returned success
      // ----------------------------------------
      fax.status = "sent";
      fax.providerFaxId = result.providerFaxId || null;
      await fax.save();

      // ----------------------------------------
      // 5. Update idempotency record
      // ----------------------------------------
      await idempotencyService.updateStatus(faxId, "sent");

      // ----------------------------------------
      // 6. Audit log
      // ----------------------------------------
      await auditService.logEvent({
        type: "OUTBOUND_FAX_SENT",
        faxId,
        provider,
        region,
        tenantId: fax.tenantId
      });

      return;

    } catch (err) {
      console.error(`❌ Fax ${faxId} failed on provider ${provider}:`, err.message);

      // ----------------------------------------
      // 7. If job still has retries left → let BullMQ retry
      // ----------------------------------------
      if (job.attemptsMade < job.opts.attempts - 1) {
        throw err; // BullMQ will retry automatically
      }

      // ----------------------------------------
      // 8. Retries exhausted → attempt failover
      // ----------------------------------------
      if (failoverProvider) {
        console.warn(
          `⚠️ Fax ${faxId} switching to failover provider ${failoverProvider}`
        );

        await retryFaxService.enqueueFailoverSend({
          faxId,
          failoverProvider,
          region
        });

        await auditService.logEvent({
          type: "OUTBOUND_FAX_FAILOVER_TRIGGERED",
          faxId,
          provider,
          failoverProvider,
          region,
          tenantId: fax?.tenantId
        });

        return;
      }

      // ----------------------------------------
      // 9. No failover provider → send to DLQ
      // ----------------------------------------
      await retryFaxService.sendToDLQ({
        faxId,
        provider,
        region,
        reason: err.message
      });

      // Update fax status
      await OutboundFax.findByIdAndUpdate(faxId, { status: "failed" });

      // Update idempotency record
      await idempotencyService.updateStatus(faxId, "failed");

      // Audit log
      await auditService.logEvent({
        type: "OUTBOUND_FAX_FAILED",
        faxId,
        provider,
        region,
        tenantId: fax?.tenantId,
        error: err.message
      });
    }
  },
  {
    connection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || "5", 10)
  }
);
