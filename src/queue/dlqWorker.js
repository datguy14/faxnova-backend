// src/queue/dlqWorker.js

const { Worker } = require("bullmq");
const Redis = require("ioredis");
const DeadLetterFax = require("../models/DeadLetterFax");

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

const dlqWorker = new Worker(
  "faxDLQ",
  async (job) => {
    const { faxId, provider, region, attempts, lastError, payload } = job.data;

    await DeadLetterFax.create({
      faxId,
      provider,
      region,
      attempts,
      lastError,
      payload
    });

    console.log(`💀 DLQ stored for faxId=${faxId}`);
  },
  { connection }
);

module.exports = dlqWorker;
