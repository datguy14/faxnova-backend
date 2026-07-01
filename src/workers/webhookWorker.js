// src/workers/webhookWorker.js

const { Worker } = require("bullmq");
const connection = require("../lib/redis");

const WebhookEvent = require("../models/WebhookEvent");
const OutboundFax = require("../models/OutboundFax");
const providerRoutingEngine = require("../services/providerRoutingEngine");
const providerHealthService = require("../services/providerHealthService");
const providerPerformanceService = require("../services/providerPerformanceService");

new Worker(
  "webhookQueue",
  async (job) => {
    const event = job.data;

    // Persist event (DB-level idempotency)
    await WebhookEvent.create({
      faxId: event.faxId,
      provider: event.provider,
      providerFaxId: event.providerFaxId,
      status: event.status,
      error: event.error,
      raw: event.raw,
      externalEventId: event.externalEventId,
      processedAt: new Date(),
    });

    // Update fax
    if (event.faxId) {
      await OutboundFax.findByIdAndUpdate(event.faxId, {
        status: event.status,
        provider: event.provider,
        providerFaxId: event.providerFaxId,
        error: event.error,
        lastEventAt: new Date(),
      });
    }

    // Update provider scoring + health
    if (event.status === "delivered") {
      providerPerformanceService.applySuccessBoost(event.provider);
      providerHealthService.setHealth(event.provider, "healthy");
    }

    if (event.status === "failed") {
      providerPerformanceService.applyFailurePenalty(event.provider);
      providerHealthService.setHealth(event.provider, "degraded");
    }

    await providerRoutingEngine.recordEvent(event.provider, event);
  },
  { connection }
);
