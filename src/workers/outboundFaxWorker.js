// src/workers/outboundFaxWorker.js

const { Worker } = require("bullmq");
const OutboundFax = require("../models/OutboundFax");
const DeadLetterFax = require("../models/DeadLetterFax");

const RoutingEngine = require("../services/routingEngine.v2");
const ProviderRouter = require("../services/providerRouter.v2");
const faxStatusService = require("../services/faxStatusService");

const connection = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
};

const worker = new Worker(
  "outboundFaxQueue",
  async (job) => {
    const { faxId, tenantId, to, from, pages, documentUrl, region, tier } = job.data;

    // Load fax record
    const fax = await OutboundFax.findOne({ faxId });
    if (!fax) {
      throw new Error(`OutboundFax not found: ${faxId}`);
    }

    // Mark as sending
    await faxStatusService.updateFaxStatus({
      faxId,
      provider: null,
      providerStatus: "sending",
      unifiedStatus: "sending",
    });

    // Sovereignty routing
    const provider = await RoutingEngine.selectProvider({
      region,
      tier,
      to,
      tenantId,
    });

    // Provider adapter
    const adapter = ProviderRouter.getAdapter(provider);

    // Send fax
    const result = await adapter.sendFax({
      to,
      from,
      pages,
      documentUrl,
      faxId,
    });

    // Update fax record
    fax.provider = provider;
    fax.providerMessageId = result.messageId;
    fax.providerStatus = result.status;
    fax.status = "sent";
    fax.updatedAt = new Date();
    await fax.save();

    // Status service
    await faxStatusService.updateFaxStatus({
      faxId,
      provider,
      providerStatus: result.status,
      unifiedStatus: "sent",
    });

    return { faxId, provider, status: "sent" };
  },
  { connection }
);

// DLQ handler
worker.on("failed", async (job, err) => {
  const { faxId } = job.data;

  await DeadLetterFax.create({
    faxId,
    reason: err.message,
    payload: job.data,
    createdAt: new Date(),
  });

  await faxStatusService.updateFaxStatus({
    faxId,
    provider: null,
    providerStatus: "dead",
    unifiedStatus: "dead",
  });

  console.error(`❌ Fax moved to DLQ: ${faxId}`, err.message);
});

// Worker ready
worker.on("ready", () => {
  console.log("📡 OutboundFaxWorker ready");
});

module.exports = worker;
