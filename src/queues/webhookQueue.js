// src/queues/webhookQueue.js

const { Queue } = require("bullmq");
const WebhookError = require("../errors/WebhookError");

const connection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT)
};

if (!connection.host || !connection.port) {
  throw new Error("Missing Redis configuration for webhookQueue");
}

/**
 * Webhook Queue — Strict‑Mode Edition
 *
 * Enqueues normalized inbound fax events for worker processing.
 */

const webhookQueue = new Queue("inboundFaxQueue", { connection });

exports.addInboundFax = async (normalized) => {
  try {
    await webhookQueue.add("inboundFaxJob", normalized, {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 }
    });
  } catch (err) {
    throw new WebhookError(`Failed to enqueue inbound fax job: ${err.message}`);
  }
};

module.exports = webhookQueue;
