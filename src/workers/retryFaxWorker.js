// src/workers/retryFaxWorker.js

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
  "retryFaxQueue",
  async (job) => {
    const { faxId } = job.data;

    const fax = await OutboundFax.findOne({ faxId });
    if (!fax) throw new Error(`OutboundFax not found: ${faxId}`);

    // Prevent retrying delivered faxes
    if (fax.status === "delivered") {
      return { faxId, status: "already_delivered" };
    }

    // Mark as retrying
    await faxStatusService.updateFaxStatus({
      faxId,
      provider: fax.provider,
      providerStatus: "retrying",
      unifiedStatus: "retrying",
    });

    // Failover routing
    const failoverProvider = await RoutingEngine.failoverProvider({
      previousProvider: fax.provider,
      region: fax.region,
      to: fax.to,
      tenantId: fax.tenantId,
    });

    const adapter = ProviderRouter.getAdapter(failoverProvider);

    const result = await adapter.sendFax({
      to: fax.to,
      from: fax.from,
      pages: fax.pages,
      documentUrl: fax.documentUrl,
      faxId,
    });

    // Update fax record
    fax.provider = failoverProvider;
    fax.providerMessageId = result.messageId;
    fax.providerStatus = result.status;
    fax.status = "sent";
    fax.attempts = (fax.attempts || 0) + 1;
    fax.updatedAt = new Date();
    await fax.save();

    // Status service
    await faxStatusService.updateFaxStatus({
      faxId,
      provider: failoverProvider,
      providerStatus: result.status,
      unifiedStatus: "sent",
    });

    return { faxId, provider: failoverProvider, status: "sent" };
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

  console.error(`❌ Retry failed → DLQ: ${faxId}`, err.message);
});

// Worker ready
worker.on("ready", () => {
  console.log("🔁 RetryFaxWorker ready");
});

module.exports = worker;
