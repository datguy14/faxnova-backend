// src/queues/webhookQueue.js
// Webhook Queue — Strict‑Mode

const Queue = require("bullmq").Queue;
const { connection } = require("../lib/redis");

const webhookQueue = new Queue("webhookQueue", {
  connection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: true,
    removeOnFail: false
  }
});

module.exports = webhookQueue;
