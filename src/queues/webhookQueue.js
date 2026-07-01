// src/queues/webhookQueue.js

const { Queue } = require("bullmq");
const connection = require("../lib/redis");

module.exports = new Queue("webhookQueue", {
  connection,
  defaultJobOptions: {
    attempts: 5, // bounded retries
    backoff: {
      type: "exponential",
      delay: 500, // base delay
    },

    // Priority tiers:
    // 1 = highest (provider failures)
    // 5 = lowest (normal webhook events)
    priority: 5,

    // Cleanup rules
    removeOnComplete: {
      age: 3600, // keep for 1 hour
      count: 5000, // max 5k completed jobs
    },
    removeOnFail: {
      age: 86400, // keep failed jobs for 24 hours
      count: 10000, // max 10k failed jobs
    },
  },
});
