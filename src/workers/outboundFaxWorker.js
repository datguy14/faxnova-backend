// src/workers/outboundFaxWorker.js

const { Worker } = require("bullmq");
const OutboundFax = require("../models/OutboundFax");
const DeadLetterFax = require("../models/DeadLetterFax");

const routingEngine = require("../services/routingService.v2");
const ProviderRouter = require("../services/providerRouter.v2");
const faxStatusService = require("../services/faxStatusService");
const providerLatencyTracker = require("../services/providerLatencyTracker");

const connection = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
};

const worker = new Worker(
  "outboundFaxQueue",
  async (job) => {
    const { faxId } = job.data;

    const fax = await OutboundFax.findOne({ faxId });
    if (!fax) throw new Error(`OutboundFax not found: ${faxId}`);

    // Mark as sending
    await faxStatusService.updateFaxStatus({
      faxId,
      provider: fax.provider,
      providerStatus: "sending",
      unifiedStatus: "sending",
    });

    // Sovereignty routing → best provider
    const provider = await routingEngine.selectProvider({
      region: fax.region,
      to: fax.to,
      tenantId: fax.tenantId,
    });

    const adapter = ProviderRouter.getAdapter(provider);

    const start = Date.now();

    const result = await adapter.sendFax({
      faxId,
      to: fax.to,
      from: fax.from,
      pages: fax.pages,
      documentUrl: fax.documentUrl,
    });

    const latency = Date.now() - start;
    await providerLatencyTracker.recordLatency(provider, latency);

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

  console.error(`❌ OutboundFaxWorker → DLQ: ${faxId}`, err.message);
});

worker.on("ready", () => {
  console.log("📡 OutboundFaxWorker ready");
});

module.exports = worker;
