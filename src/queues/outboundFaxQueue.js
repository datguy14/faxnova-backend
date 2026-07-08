// src/queues/outboundFaxQueue.js
// Outbound Fax Queue — Strict‑Mode

const Queue = require("bullmq").Queue;
const { connection } = require("../lib/redis");

const outboundFaxQueue = new Queue("outboundFaxQueue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

module.exports = outboundFaxQueue;
