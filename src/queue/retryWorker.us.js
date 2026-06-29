// src/queue/retryWorker.us.js

const { Worker } = require("bullmq");
const Redis = require("ioredis");
const { retryFax } = require("../services/retryFaxService");
const FaxNovaError = require("../errors/FaxNovaError");
const dlqQueue = require("./dlqQueue");

const connection = new Redis({
  host: process.env.REDIS_HOST_US,
  port: process.env.REDIS_PORT_US,
  password: process.env.REDIS_PASSWORD_US
});

const retryWorkerUS = new Worker(
  "faxRetryQueue",
  async (job) => {
    const { region } = job.data;

    // Only process US-region jobs
    if (region !== "us") return;

    try {
      const { faxId } = job.data;
      return await retryFax(faxId, "us");

    } catch (err) {
      throw new FaxNovaError("US retry worker failed", {
        code: "RETRY_WORKER_US_FAILED",
        details: err.message
      });
    }
  },
  { connection }
);

// ---------------------------
// Failure Handling
// ---------------------------
retryWorkerUS.on("failed", async (job, err) => {
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
});

module.exports = retryWorkerUS;
