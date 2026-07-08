// src/workers/outboundFaxWorker.js
// Strict‑Mode Outbound Fax Worker

const { telnyx, sinch } = require("../providers");
const { markFailure, markRecovery } = require("../services/providerOutageService");
const { outboundFaxQueue } = require("../queues/outboundFaxQueue");

async function processJob(job) {
  const data = job.data;

  const {
    to,
    from,
    fileUrl,
    metadata = {},
    userId,
    provider
  } = data;

  const providerClient = provider === "telnyx" ? telnyx : sinch;

  try {
    const result = await providerClient.sendFax({
      to,
      from,
      fileUrl,
      metadata,
      userId
    });

    // Mark provider healthy
    await markRecovery(provider);

    return {
      ok: true,
      provider,
      faxId: result.faxId,
      diagnostics: result.diagnostics || null
    };
  } catch (err) {
    console.error(`❌ Outbound fax failed [${provider}]:`, err);

    // Mark provider failure
    await markFailure(provider);

    throw err;
  }
}

outboundFaxQueue.process(async (job) => {
  return processJob(job);
});

console.log("📡 OutboundFaxWorker listening for jobs");

module.exports = {
  processJob
};
