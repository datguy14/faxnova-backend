// src/queue/retryWorker.eu.js

const { Worker } = require("bullmq");
const Redis = require("ioredis");
const { retryFax } = require("../services/retryFaxService");
const FaxNovaError = require("../errors/FaxNovaError");
const dlqQueue = require("./dlqQueue");

const connection = new Redis({
  host: process.env.REDIS_HOST_EU,
  port: process.env.REDIS_PORT_EU,
  password: process.env.REDIS_PASSWORD_EU
});

const retryWorkerEU = new Worker(
  "faxRetryQueue",
  async (job) => {
    const { region } = job.data;

    // Only process EU-region jobs
    if (region !== "eu") return;

    try {
      const { faxId } = job.data;
      return await retryFax(faxId, "eu");

    } catch (err) {
      throw new FaxNovaError("EU retry worker failed", {
        code: "RETRY_WORKER_EU_FAILED",
        details: err.message
      });
    }
  },
  { connection }
);

// ---------------------------
// Failure Handling
// ---------------------------
retryWorkerEU.on("failed", async (job, err) => {
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

module.exports = retryWorkerEU;
