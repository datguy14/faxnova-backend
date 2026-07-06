// src/workers/retryFaxWorker.js

const { Worker } = require("bullmq");

const OutboundFax = require("../models/OutboundFax");
const FaxEventService = require("../services/FaxEventService");

const ProviderRouter = require("../services/providerRouter.v2");

const telnyxAdapter = require("../providers/telnyxAdapter");
const sinchAdapter = require("../providers/sinchAdapter");

const FaxError = require("../errors/FaxError");
const { connection } = require("../lib/redis");

function getAdapter(provider) {
  return provider === "telnyx" ? telnyxAdapter : sinchAdapter;
}

function getFailoverProvider(provider) {
  return provider === "telnyx" ? "sinch" : "telnyx";
}

const retryFaxWorker = new Worker(
  "retryFaxQueue",
  async (job) => {
    const { faxId } = job.data;

    const fax = await OutboundFax.findById(faxId);
    if (!fax) throw new FaxError("Outbound fax not found");

    const provider = ProviderRouter.pickOutboundProvider(fax.provider);
    const adapter = getAdapter(provider);

    // First retry attempt
    let result = await adapter.sendFax({
      to: fax.to,
      storageKey: fax.storageKey,
      region: fax.region
    });

    // Failover if needed
    if (!result.ok) {
      const failoverProvider = getFailoverProvider(provider);
      const failoverAdapter = getAdapter(failoverProvider);

      result = await failoverAdapter.sendFax({
        to: fax.to,
        storageKey: fax.storageKey,
        region: fax.region
      });

      if (!result.ok) {
        throw new FaxError(`Retry + failover failed: ${result.error}`);
      }

      fax.provider = failoverProvider;
    }

    // Update fax record
    fax.providerFaxId = result.providerFaxId;
    await fax.save();

    // Record event
    await FaxEventService.recordOutbound({
      provider: fax.provider,
      providerFaxId: result.providerFaxId,
      to: fax.to,
      storageKey: fax.storageKey,
      region: fax.region
    });

    return { ok: true, providerFaxId: result.providerFaxId };
  },
  { connection }
);

module.exports = retryFaxWorker;
