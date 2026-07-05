// src/workers/retryFaxWorker.js

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
  throw new Error("Missing Redis configuration for retryFaxWorker");
}

/**
 * Retry Fax Worker — Strict‑Mode Edition
 *
 * Processes failed outbound fax jobs from retryFaxQueue.
 * Retries fax → records event → escalates errors if still failing.
 */

const retryFaxWorker = new Worker(
  "retryFaxQueue",
  async (job) => {
    const { provider, to, storageKey, region, attempt } = job.data;

    // Provider selection
    let adapter;
    if (provider === "telnyx") adapter = telnyxAdapter;
    else if (provider === "sinch") adapter = sinchAdapter;
    else throw new ProviderError(`Unknown provider: ${provider}`);

    // Retry send
    const result = await adapter.sendFax({ to, storageKey, region });

    if (!result.ok) {
      throw new FaxError(
        `Retry attempt ${attempt} failed: ${result.error}`
      );
    }

    // Persist retry event
    await FaxEventService.recordOutbound({
      provider,
      providerFaxId: result.providerFaxId,
      to,
      storageKey,
      region
    });

    return {
      ok: true,
      providerFaxId: result.providerFaxId,
      attempt
    };
  },
  { connection }
);

module.exports = retryFaxWorker;
