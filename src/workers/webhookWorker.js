// src/workers/webhookWorker.js

module.exports = async function processWebhook(job) {
  const event = job.data;

  // ❌ REMOVE job.updatePriority()
  // Priority must be set at queue time

  // Continue with webhook processing...
};
