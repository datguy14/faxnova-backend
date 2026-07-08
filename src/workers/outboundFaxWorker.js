// src/workers/outboundFaxWorker.js — Unified Fax Architecture (CommonJS Only)

const { Worker } = require("bullmq");
const { connection } = require("../lib/redis");

const sendFaxService = require("../services/sendFaxService");
const OutboundFax = require("../models/OutboundFax");
const auditService = require("../services/auditService");
const billingService = require("../services/billingService");
const retryFaxService = require("../services/retryFaxService");

module.exports = new Worker(
  "outboundFaxQueue",
  async job => {
    const data = job.data;

    try {
      const {
        faxId,
        tenantId,
        provider,
        failoverProvider,
        region,
        storageKey,
        idempotencyKey,
        to
      } = data;

      // ---------------------------------------------------------
      // 1. Load outbound fax record
      // ---------------------------------------------------------
      const fax = await OutboundFax.findById(faxId);
      if (!fax) {
        throw new Error(`OutboundFaxWorker: Fax not found: ${faxId}`);
      }

      // ---------------------------------------------------------
      // 2. Send fax via unified outbound pipeline
      // ---------------------------------------------------------
      const result = await sendFaxService.sendFax({
        faxId,
        tenantId,
        provider,
        region,
        storageKey,
        idempotencyKey,
        to
      });

      // ---------------------------------------------------------
      // 3. Billing hook (outbound processing)
      // ---------------------------------------------------------
      await billingService.trackOutboundQueued({
        faxId,
        tenantId
      });

      // ---------------------------------------------------------
      // 4. Audit log
      // ---------------------------------------------------------
      await auditService.logEvent({
        type: "OUTBOUND_FAX_WORKER_SENT",
        faxId,
        tenantId,
        provider,
        region,
        providerFaxId: result.providerFaxId || null,
        details: {
          to,
          storageKey
        }
      });

      return {
        success: true,
        faxId,
        provider,
        providerFaxId: result.providerFaxId || null,
        status: fax.status
      };
    } catch (err) {
      console.error("OutboundFaxWorker Error:", err.message);

      // ---------------------------------------------------------
      // 5. Audit error
      // ---------------------------------------------------------
      await auditService.logEvent({
        type: "OUTBOUND_FAX_WORKER_ERROR",
        faxId: data.faxId || null,
        provider: data.provider || null,
        tenantId: data.tenantId || null,
        region: data.region || null,
        details: { error: err.message }
      });

      // ---------------------------------------------------------
      // 6. Failover trigger (if outbound failed early)
      // ---------------------------------------------------------
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
