// src/workers/webhookWorker.js

const { Worker } = require("bullmq");
const connection = require("../lib/redis");

const deadLetterQueue = require("../queues/deadLetterQueue");
const ProviderError = require("../errors/ProviderError");
const WebhookError = require("../errors/WebhookError");

new Worker(
  "webhookQueue",
  async (job) => {
    try {
      const event = job.data;

      // Provider-aware priority escalation
      if (event.status === "failed") {
        job.updatePriority(1);
      }

      if (event.status === "delivered") {
        job.updatePriority(2);
      }

      // Process event normally
      await processWebhookEvent(event);

    } catch (err) {
      // Poison message → DLQ
      if (job.attemptsMade >= job.opts.attempts) {
        await deadLetterQueue.add("deadLetterEvent", {
          event: job.data,
          error: err instanceof Error ? err.message : String(err),
          context: err.context || {},
          failedAt: new Date(),
        });
      }

      throw err;
    }
  },
  { connection }
);
