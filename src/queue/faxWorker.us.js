// src/queue/faxWorker.us.js

const { Worker } = require("bullmq");
const Redis = require("ioredis");
const { sendFax } = require("../services/sendFaxService");
const FaxNovaError = require("../errors/FaxNovaError");
const retryQueue = require("./retryQueue");
const dlqQueue = require("./dlqQueue");

const connection = new Redis({
  host: process.env.REDIS_HOST_US,
  port: process.env.REDIS_PORT_US,
  password: process.env.REDIS_PASSWORD_US
});

const faxWorkerUS = new Worker(
  "outboundFaxQueue",
  async (job) => {
    const { region } = job.data;

    // Only process US-region jobs
    if (region !== "us") return;

    try {
      const { tenantId, to, from, pages, documentUrl, tier } = job.data;

      return await sendFax({
        tenantId,
        to,
        from,
        pages,
        documentUrl,
        tier,
        region: "us"
      });

    } catch (err) {
      throw new FaxNovaError("US fax worker failed", {
        code: "FAX_WORKER_US_FAILED",
        details: err.message
      });
    }
  },
  { connection }
);

// ---------------------------
// Failure Handling
// ---------------------------
faxWorkerUS.on("failed", async (job, err) => {
  const { faxId, provider, region } = job.data;

  // If job exhausted all attempts → DLQ
  if (job.attemptsMade >= job.opts.attempts) {
    await dlqQueue.add("deadFax", {
      faxId,
      provider,
      region,
      attempts: job.attemptsMade,
      lastError: err.message,
      payload: job.data
    });
    return;
  }

  // Otherwise schedule retry
  await retryQueue.add(
    "retryFax",
    { faxId, provider, region },
    {
      delay: 5 * 60 * 1000, // 5 minutes
      attempts: 3,
      backoff: { type: "exponential", delay: 5 * 60 * 1000 }
    }
  );
});

module.exports = faxWorkerUS;
