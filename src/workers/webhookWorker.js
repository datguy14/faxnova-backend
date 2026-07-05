// src/workers/webhookWorker.js

const { Worker } = require("bullmq");

const FaxEventService = require("../services/FaxEventService");

const telnyxInboundAdapter = require("../providers/telnyxInboundAdapter");
const sinchInboundAdapter = require("../providers/sinchInboundAdapter");

const ProviderError = require("../errors/ProviderError");
const WebhookError = require("../errors/WebhookError");

const connection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT)
};

if (!connection.host || !connection.port) {
  throw new Error("Missing Redis configuration for webhookWorker");
}

/**
 * Webhook Worker — Strict‑Mode Edition
 *
 * Processes inbound fax jobs from inboundFaxQueue.
 * Normalizes → validates → persists inbound fax events.
 */

const webhookWorker = new Worker(
  "inboundFaxQueue",
  async (job) => {
    const { provider, raw } = job.data;

    // Provider selection
    let adapter;
    if (provider === "telnyx") adapter = telnyxInboundAdapter;
    else if (provider === "sinch") adapter = sinchInboundAdapter;
    else throw new ProviderError(`Unknown provider: ${provider}`);

    // Normalize inbound fax payload
    const normalized = adapter.normalizeInboundFax(raw);

    if (!normalized.ok) {
      throw new WebhookError(normalized.error);
    }

    // Persist inbound fax event
    await FaxEventService.recordInbound(normalized);

    return { ok: true, providerFaxId: normalized.providerFaxId };
  },
  { connection }
);

module.exports = webhookWorker;
