// src/workers/outboundFaxWorker.js — Unified Fax Architecture (CommonJS Only)

const { Worker } = require("bullmq");
const { connection } = require("../lib/redis");

const sendFaxService = require("../services/sendFaxService");
const Fax = require("../models/Fax");
const auditService = require("../services/auditService");
const billingService = require("../services/billingService");
const retryFaxService = require("../services/retryFaxService");

module.exports = new Worker(
  "outboundFaxQueue",
  async job => {
    const data = job.data;

    try {
      const {
        tenantId,
        idempotencyKey,
        to,
        from,
        region,
        provider,
        failoverProvider,
        pdfBuffer,
        metadata
      } = data;

      // ----------------------------------------
      // 1. Send fax via unified outbound pipeline
      // ----------------------------------------
      const result = await sendFaxService.sendFax({
        tenantId,
        idempotencyKey,
        to,
        from,
        region,
        provider,
        failoverProvider,
        pdfBuffer,
        metadata
      });

      const faxId = result.faxId;

      // ----------------------------------------
      // 2. Load unified Fax record
      // ----------------------------------------
      const fax = await Fax.findById(faxId);
      if (!fax) {
        throw new Error(`Outbound worker cannot find fax ${faxId}`);
      }

      // ----------------------------------------
      // 3. Billing hook (outbound queued)
      // ----------------------------------------
      await billingService.trackOutboundQueued({
        faxId,
        tenantId
      });

      // ----------------------------------------
      // 4. Audit log
      // ----------------------------------------
      await auditService.logEvent({
        tenantId,
        faxId,
        type: "OUTBOUND_FAX_WORKER_QUEUED",
        action: "worker_queued",
        provider,
        providerStatus: "processing",
        region,
        details: {
          to,
          from,
          providerFaxId: fax.providerFaxId
        }
      });

      return {
        success: true,
        faxId,
        provider,
        providerFaxId: fax.providerFaxId,
        status: fax.status
      };
    } catch (err) {
      console.error("Outbound fax worker error:", err.message);

      // ----------------------------------------
      // 5. Audit error
      // ----------------------------------------
      await auditService.logEvent({
        type: "OUTBOUND_FAX_WORKER_ERROR",
        faxId: data.faxId || null,
        provider: data.provider || null,
        tenantId: data.tenantId || null,
        region: data.region || null,
        details: { error: err.message }
      });

      // ----------------------------------------
      // 6. Failover trigger (if outbound failed early)
      // ----------------------------------------
      if (data.failoverProvider) {
        await retryFaxService.enqueueFailoverSend({
          faxId: data.faxId,
          failoverProvider: data.failoverProvider,
          region: data.region
        });

        await auditService.logEvent({
          type: "OUTBOUND_FAX_FAILOVER_TRIGGERED_BY_WORKER_ERROR",
          faxId: data.faxId,
          provider: data.provider,
          failoverProvider: data.failoverProvider,
          region: data.region,
          tenantId: data.tenantId
        });
      }

      throw err;
    }
  },
  { connection }
);
