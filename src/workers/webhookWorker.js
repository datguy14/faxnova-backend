// src/workers/webhookWorker.js
// Webhook Worker — Strict‑Mode

const webhookQueue = require("../queues/webhookQueue");
const telnyxInbound = require("../providers/telnyxInboundAdapter");
const sinchInbound = require("../providers/sinchInboundAdapter");

webhookQueue.process(async (job) => {
  const { provider, event } = job.data;

  console.log(`📡 WebhookWorker: Processing ${provider} webhook (job=${job.id})`);

  try {
    if (provider === "telnyx") {
      return await telnyxInbound(event);
    }

    if (provider === "sinch") {
      return await sinchInbound(event);
    }

    throw new Error(`Unknown provider: ${provider}`);
  } catch (err) {
    console.error(`❌ Webhook processing failed (job=${job.id}):`, err);
    throw err;
  }
});
