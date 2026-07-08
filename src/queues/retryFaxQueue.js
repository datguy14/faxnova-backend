// src/queues/retryFaxQueue.js
// Retry Fax Queue — Strict‑Mode

const Queue = require("bullmq").Queue;
const { connection } = require("../lib/redis");

const retryFaxQueue = new Queue("retryFaxQueue", {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 10000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

module.exports = retryFaxQueue;
