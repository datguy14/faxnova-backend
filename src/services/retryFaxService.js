// src/services/retryFaxService.js — Unified Fax Architecture (CommonJS Only)

const outboundFaxQueue = require("../queues/outboundFaxQueue");
const auditService = require("./auditService");
const Fax = require("../models/Fax");

module.exports = {
  /**
   * Enqueue failover send for outbound fax.
   * Called when provider webhook triggers a failover event.
   */
  async enqueueFailoverSend({ faxId, failoverProvider, region }) {
    const fax = await Fax.findById(faxId);
    if (!fax) {
      await auditService.logEvent({
        type: "FAILOVER_FAX_NOT_FOUND",
        faxId,
        failoverProvider,
        region
      });
      return;
    }

    // Prevent infinite failover loops
    const idempotencyKey = `failover:${faxId}:${Date.now()}`;

    await outboundFaxQueue.add("sendFax", {
      tenantId: fax.tenantId,
      idempotencyKey,
      to: fax.to,
      from: fax.from,
      region,
      provider: failoverProvider,
      failoverProvider: null, // stop chain
      pdfBuffer: null,        // worker loads from storageKey
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
        storageKey: fax.storageKey,
        idempotencyKey
      }
    });
  }
};
