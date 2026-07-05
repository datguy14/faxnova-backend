// src/workers/outboundFaxWorker.js

const { Worker } = require("bullmq");

const FaxEventService = require("../services/FaxEventService");

const telnyxAdapter = require("../providers/telnyxAdapter");
const sinchAdapter = require("../providers/sinchAdapter");

const ProviderError = require("../errors/ProviderError");
const FaxError = require("../errors/FaxError");

const connection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT)
};

if (!connection.host || !connection.port) {
  throw new Error("Missing Redis configuration for outboundFaxWorker");
}

/**
 * Outbound Fax Worker — Strict‑Mode Edition
 *
 * Processes outbound fax jobs from outboundFaxQueue.
 * Sends fax → records event → handles provider errors.
 */

const outboundFaxWorker = new Worker(
  "outboundFaxQueue",
  async (job) => {
    const { provider, to, storageKey, region } = job.data;

    // Provider selection
    let adapter;
    if (provider === "telnyx") adapter = telnyxAdapter;
    else if (provider === "sinch") adapter = sinchAdapter;
    else throw new ProviderError(`Unknown provider: ${provider}`);

    // Send fax
    const result = await adapter.sendFax({ to, storageKey, region });

    if (!result.ok) {
      throw new FaxError(result.error);
    }

    // Persist outbound fax event
    await FaxEventService.recordOutbound({
      provider,
      providerFaxId: result.providerFaxId,
      to,
      storageKey,
      region
    });

    return { ok: true, providerFaxId: result.providerFaxId };
  },
  { connection }
);

module.exports = outboundFaxWorker;
