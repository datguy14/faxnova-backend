// src/workers/outboundWorker.js — Unified Fax Architecture (CommonJS Only)

const outboundQueue = require("../queues/outboundQueue");
const Fax = require("../models/Fax");
const Tenant = require("../models/Tenant");
const providerApiService = require("../providers/providerApiService");
const faxStorageService = require("../storage/faxStorageService");
const auditService = require("../services/auditService");
const billingService = require("../services/billingService");
const retryFaxService = require("../services/retryFaxService");

outboundQueue.process(async (job) => {
  const { faxId, tenantId } = job.data;

  const fax = await Fax.findById(faxId);
  const tenant = await Tenant.findById(tenantId);

  if (!fax || !tenant) {
    await auditService.logEvent({
      type: "OUTBOUND_UNKNOWN_FAX_OR_TENANT",
      details: { faxId, tenantId }
    });
    return;
  }

  // Load PDF buffer from storage
  const storageResult = await faxStorageService.getFax(fax.storageKey);
  if (!storageResult.ok) {
    await auditService.logEvent({
      type: "OUTBOUND_STORAGE_READ_FAILED",
      faxId,
      tenantId,
      details: storageResult
    });
    return;
  }

  const buffer = storageResult.buffer;

  await auditService.logEvent({
    type: "OUTBOUND_SEND_ATTEMPT",
    faxId,
    tenantId,
    provider: tenant.providers.primary,
    region: tenant.residencyZone,
    details: { to: fax.to }
  });

  // Send fax through provider API layer
  const result = await providerApiService.sendFax({
    provider: tenant.providers.primary,
    to: fax.to,
    buffer,
    storageKey: fax.storageKey,
    faxId,
    region: tenant.residencyZone
  });

  if (!result.ok) {
    await auditService.logEvent({
      type: "OUTBOUND_PROVIDER_FAILURE",
      faxId,
      tenantId,
      provider: tenant.providers.primary,
      details: result
    });

    // Trigger failover
    await retryFaxService.enqueueFailoverSend({
      faxId,
      failoverProvider: tenant.providers.failover,
      region: tenant.residencyZone
    });

    return;
  }

  // Update fax record
  fax.provider = tenant.providers.primary;
  fax.providerFaxId = result.providerFaxId;
  fax.providerStatus = "sent";
  await fax.save();

  // Billing
  await billingService.trackOutboundFax({
    faxId,
    tenantId,
    provider: tenant.providers.primary,
    region: tenant.residencyZone
  });

  // Audit
  await auditService.logEvent({
    type: "OUTBOUND_SEND_SUCCESS",
    faxId,
    tenantId,
    provider: tenant.providers.primary,
    details: result
  });
});
