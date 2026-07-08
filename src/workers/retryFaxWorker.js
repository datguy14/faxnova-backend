// src/workers/retryFaxWorker.js
// Retry Fax Worker — Strict‑Mode

const { routeFax } = require("../routing/engine");
const retryFaxQueue = require("../queues/retryFaxQueue");

retryFaxQueue.process(async (job) => {
  const payload = job.data;

  console.log(`🔁 RetryFaxWorker: Retrying fax job ${job.id}`);

  try {
    const result = await routeFax(payload);

    console.log(
      `✅ Retry succeeded via ${result.provider} (job=${job.id})`,
      result.result
    );

    return result;
  } catch (err) {
    console.error(`❌ Retry failed (job=${job.id}):`, err);

    // Optional: exponential backoff or dead-letter queue
    throw err;
  }
});
