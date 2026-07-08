// src/queues/outboundFaxQueue.js — Unified Fax Architecture (CommonJS Only)

const { Queue } = require("bullmq");
const { connection } = require("../lib/redis");

const outboundFaxQueue = new Queue("outboundFaxQueue", {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000
    }
  }
});

module.exports = outboundFaxQueue;
