// src/queues/outboundFaxQueue.js

const { Queue } = require("bullmq");
const FaxError = require("../errors/FaxError");

const connection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT)
};

if (!connection.host || !connection.port) {
  throw new Error("Missing Redis configuration for outboundFaxQueue");
}

/**
 * Outbound Fax Queue — Strict‑Mode Edition
 *
 * Enqueues outbound fax jobs for outboundFaxWorker.
 * Failed jobs are automatically routed to retryFaxQueue.
 */

const outboundFaxQueue = new Queue("outboundFaxQueue", { connection });

exports.addOutboundFax = async (payload) => {
  try {
    await outboundFaxQueue.add("outboundFaxJob", payload, {
      attempts: 1, // strict-mode: outbound worker handles first attempt only
      removeOnComplete: true,
      removeOnFail: false // failed jobs go to retryFaxQueue
    });
  } catch (err) {
    throw new FaxError(`Failed to enqueue outbound fax job: ${err.message}`);
  }
};

module.exports = outboundFaxQueue;
