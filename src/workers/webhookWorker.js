// src/workers/webhookWorker.js

const { Worker } = require("bullmq");

const FaxEventService = require("../services/FaxEventService");
const ProviderRouter = require("../services/providerRouter.v2");

const telnyxInboundAdapter = require("../providers/telnyxInboundAdapter");
const sinchInboundAdapter = require("../providers/sinchInboundAdapter");

const { connection } = require("../lib/redis");
const WebhookError = require("../errors/WebhookError");

const webhookWorker = new Worker(
  "inboundFaxQueue",
  async (job) => {
    const { provider, raw } = job.data;

    const selected = ProviderRouter.pickInboundProvider(provider);

    const adapter =
      selected === "telnyx"
        ? telnyxInboundAdapter
        : sinchInboundAdapter;

    const normalized = adapter.normalizeInboundFax(raw);

    if (!normalized.ok) {
      throw new WebhookError(normalized.error);
    }

    await FaxEventService.recordInbound(normalized);

    return { ok: true, providerFaxId: normalized.providerFaxId };
  },
  { connection }
);

module.exports = webhookWorker;
