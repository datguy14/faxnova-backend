// src/services/retryFaxService.js — Unified Fax Architecture (CommonJS Only)

const Fax = require("../models/Fax");
const failoverQueue = require("../queues/failoverQueue");
const auditService = require("./auditService");

module.exports = {
  async enqueueFailoverSend({ faxId, failoverProvider, region }) {
    await auditService.logEvent({
      type: "FAILOVER_ENQUEUED",
      faxId,
      provider: failoverProvider,
      region,
      details: { faxId, failoverProvider, region }
    });

    return failoverQueue.add("failoverSend", {
      faxId,
      failoverProvider,
      region
    });
  }
};
