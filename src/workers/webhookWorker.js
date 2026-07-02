// src/workers/webhookWorker.js

const WebhookEvent = require("../models/WebhookEvent");
const OutboundFax = require("../models/OutboundFax");
const providerPerformanceService = require("../services/providerPerformanceService");
const providerOutageService = require("../services/providerOutageService");
const providerHealthService = require("../services/providerHealthService");
const redis = require("../lib/redis");

module.exports = async function processWebhookBatch(job) {
  const events = job.data.events; // array of webhook payloads

  const webhookDocs = [];
  const faxUpdates = [];

  for (const evt of events) {
    const {
      externalEventId,
      provider,
      faxId,
      status,
      raw
    } = evt;

    // Idempotency check
    const exists = await WebhookEvent.findOne({ externalEventId });
    if (exists) continue;

    webhookDocs.push({
      externalEventId,
      provider,
      faxId,
      status,
      providerStatus: evt.providerStatus,
      errorCode: evt.errorCode,
      errorMessage: evt.errorMessage,
      raw,
      receivedAt: new Date()
    });

    // Provider feedback
    if (status === "delivered") {
      await providerPerformanceService.applySuccessBoost(provider);
      await providerOutageService.recordSuccess(provider);
    } else if (status === "failed") {
      await providerPerformanceService.applyFailurePenalty(provider);
      await providerOutageService.recordFailure(provider);
    }

    await providerHealthService.evaluate(provider);

    // Fax status update
    faxUpdates.push({
      updateOne: {
        filter: { faxId },
        update: {
          status,
          errorCode: evt.errorCode,
          errorMessage: evt.errorMessage
        }
      }
    });
  }

  // Batch insert webhook events
  if (webhookDocs.length > 0) {
    await WebhookEvent.insertMany(webhookDocs);
  }

  // Batch update faxes
  if (faxUpdates.length > 0) {
    await OutboundFax.bulkWrite(faxUpdates);
  }
};
