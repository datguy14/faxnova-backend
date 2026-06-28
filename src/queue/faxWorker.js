// src/queue/faxWorker.js

const { Worker } = require("bullmq");
const Redis = require("ioredis");
const { sendFax } = require("../services/sendFaxService");
const FaxNovaError = require("../errors/FaxNovaError");

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

const faxWorker = new Worker(
  "outboundFaxQueue",
  async (job) => {
    try {
      const { tenantId, to, from, pages, documentUrl, tier } = job.data;

      return await sendFax({
        tenantId,
        to,
        from,
        pages,
        documentUrl,
        tier
      });
    } catch (err) {
      throw new FaxNovaError("Fax worker failed", {
        code: "FAX_WORKER_FAILED",
        details: err.message
      });
    }
  },
  { connection }
);

faxWorker.on("completed", (job) => {
  console.log(`📨 Fax job completed: ${job.id}`);
});

faxWorker.on("failed", (job, err) => {
  console.error(`❌ Fax job failed: ${job.id}`, err);
});

module.exports = faxWorker;
