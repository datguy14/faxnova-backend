// src/workers/failoverWorker.js — Unified Fax Architecture (CommonJS Only)

const failoverQueue = require("../queues/failoverQueue");
const Fax = require("../models/Fax");
const providerApiService = require("../providers/providerApiService");
const auditService = require("../services/auditService");
const billingService = require("../services/billingService");

failoverQueue.process(async (job) => {
  const { faxId, failoverProvider, region } = job.data;

  const fax = await Fax.findById(faxId);
  if (!fax) {
    await auditService.logEvent({
      type: "FAILOVER_UNKNOWN_FAX",
      details: { faxId }
    });
    return;
  }

  await auditService.logEvent({
    type: "FAILOVER_ATTEMPT",
    faxId,
    provider: failoverProvider,
    region,
    details: { faxId, failoverProvider }
  });

  const result = await providerApiService.sendFax({
    provider: failoverProvider,
    to: fax.to,
    buffer: fax.buffer,
    storageKey: fax.storageKey,
    faxId,
    region
  });

  if (!result.ok) {
    await auditService.logEvent({
      type: "FAILOVER_FAILED",
      faxId,
      provider: failoverProvider,
      details: result
    });
    return;
  }

  fax.provider = failoverProvider;
  fax.providerFaxId = result.providerFaxId;
  fax.failoverUsed = true;
  await fax.save();

  await billingService.trackOutboundFax({
    faxId,
    tenantId: fax.tenantId,
    provider: failoverProvider,
    region
  });

  await auditService.logEvent({
    type: "FAILOVER_SUCCESS",
    faxId,
    provider: failoverProvider,
    details: result
  });
});
