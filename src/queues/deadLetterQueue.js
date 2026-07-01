// src/queues/deadLetterQueue.js

const { Queue } = require("bullmq");
const connection = require("../lib/redis");

module.exports = new Queue("deadLetterQueue", {
  connection,
  defaultJobOptions: {
    priority: 10, // lowest priority
    removeOnComplete: false,
    removeOnFail: false,
  },
});
