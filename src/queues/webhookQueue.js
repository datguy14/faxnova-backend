// src/queues/webhookQueue.js

const { Queue } = require("bullmq");
const connection = require("../lib/redis");

module.exports = new Queue("webhookQueue", {
  connection,
  defaultJobOptions: {
    attempts: 5, // max retries
    backoff: {
      type: "exponential",
      delay: 500, // base delay
    },
    removeOnComplete: true,
    removeOnFail: false, // keep failures for DLQ processing
  },
});
