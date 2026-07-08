// src/workers/outboundFaxWorker.js
// Outbound Fax Worker — Strict‑Mode

const { routeFax } = require("../routing/engine");
const outboundFaxQueue = require("../queues/outboundFaxQueue");

outboundFaxQueue.process(async (job) => {
  const payload = job.data;

  console.log(`📨 OutboundFaxWorker: Processing fax job ${job.id}`);

  try {
    const result = await routeFax(payload);

    console.log(
      `✅ Fax sent via ${result.provider} (job=${job.id})`,
      result.result
    );

    return result;
  } catch (err) {
    console.error(`❌ Fax send failed (job=${job.id}):`, err);

    // Move to retry queue
    const retryQueue = require("../queues/retryFaxQueue");
    await retryQueue.add("retryFax", payload);

    throw err;
  }
});
