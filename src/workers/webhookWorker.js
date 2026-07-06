// src/workers/webhookWorker.js

const { Worker } = require("bullmq");
const { connection } = require("../lib/redis");
const webhookService = require("../services/webhookService");

module.exports = new Worker(
  "webhookQueue",
  async job => {
    await webhookService.processWebhook(job.data);
  },
  { connection }
);
