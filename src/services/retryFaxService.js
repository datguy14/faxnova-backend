// src/services/retryFaxService.js — Unified Fax Architecture (CommonJS Only)

const outboundFaxQueue = require("../queues/outboundFaxQueue");
const auditService = require("./auditService");
const Fax = require("../models/Fax");

module.exports = {
  /**
   * Enqueue failover send for outbound fax.
   */
  async enqueueFailoverSend({ faxId, failoverProvider, region }) {
    const fax = await Fax.findById(faxId);
    if (!fax) {
      console.error("RetryFaxService: Fax not found:", faxId);
      return;
    }

    await outboundFaxQueue.add("sendFax", {
      tenantId: fax.tenantId,
      idempotencyKey: `failover:${faxId}:${Date.now()}`,
      to: fax.to,
      from: fax.from,
      region,
      provider: failoverProvider,
      failoverProvider: null, // prevent infinite failover loops
      pdfBuffer: null, // worker will load from storageKey
      metadata: fax.metadata,
      storageKey: fax.storageKey
    });

    await auditService.logEvent({
      type: "FAILOVER_ENQUEUED",
      faxId,
      tenantId: fax.tenantId,
      provider: fax.provider,
      failoverProvider,
      region,
      details: {
        originalProvider: fax.provider,
        storageKey: fax.storageKey
      }
    });
  }
};
