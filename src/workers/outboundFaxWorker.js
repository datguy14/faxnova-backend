// src/workers/outboundFaxWorker.js

const { Worker } = require("bullmq");

const OutboundFax = require("../models/OutboundFax");
const FaxEventService = require("../services/FaxEventService");

const ProviderRouter = require("../services/providerRouter.v2");
const telnyxAdapter = require("../providers/telnyxAdapter");
const sinchAdapter = require("../providers/sinchAdapter");

const { connection } = require("../lib/redis");
const FaxError = require("../errors/FaxError");

const outboundFaxWorker = new Worker(
  "outboundFaxQueue",
  async (job) => {
    const { provider, to, storageKey, region, faxId } = job.data;

    const selected = ProviderRouter.pickOutboundProvider(provider);

    const adapter =
      selected === "telnyx"
        ? telnyxAdapter
        : sinchAdapter;

    const result = await adapter.sendFax({ to, storageKey, region });

    if (!result.ok) {
      throw new FaxError(result.error);
    }

    // Update OutboundFax record
    const fax = await OutboundFax.findById(faxId);
    if (fax) {
      fax.providerFaxId = result.providerFaxId;
      await fax.save();
    }

    await FaxEventService.recordOutbound({
      provider: selected,
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
