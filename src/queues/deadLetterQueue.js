// src/queues/deadLetterQueue.js

const { Queue } = require("bullmq");
const connection = require("../lib/redis");

module.exports = new Queue("deadLetterQueue", {
  connection,
  defaultJobOptions: {
    removeOnComplete: false,
    removeOnFail: false,
  },
});
