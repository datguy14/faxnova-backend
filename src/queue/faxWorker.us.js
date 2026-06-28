// src/queue/faxWorker.us.js

const { Worker } = require("bullmq");
const Redis = require("ioredis");
const { sendFax } = require("../services/sendFaxService");
const FaxNovaError = require("../errors/FaxNovaError");

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
    if (region !== "us") {
      return;
    }

    try {
      const { tenantId, to, from, pages, documentUrl, tier } = job.data;
      return await sendFax({ tenantId, to, from, pages, documentUrl, tier });
    } catch (err) {
      throw new FaxNovaError("US fax worker failed", {
        code: "FAX_WORKER_US_FAILED",
        details: err.message
      });
    }
  },
  { connection }
);

module.exports = faxWorkerUS;
