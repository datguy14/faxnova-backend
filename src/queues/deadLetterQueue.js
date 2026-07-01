// src/workers/deadLetterWorker.js

const { Worker } = require("bullmq");
const connection = require("../lib/redis");
const webhookQueue = require("../queues/webhookQueue");

new Worker(
  "deadLetterQueue",
  async (job) => {
    const { event } = job.data;

    // DLQ does NOT auto-process
    // It waits for manual review via API/UI
    console.log("DLQ event waiting for manual review:", event.externalEventId);
  },
  { connection }
);
