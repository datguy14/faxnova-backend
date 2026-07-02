// src/workers/retryFaxWorker.js

const OutboundFax = require("../models/OutboundFax");
const sendFaxService = require("../services/sendFaxService");
const providerOutageService = require("../services/providerOutageService");

module.exports = async function processRetryFax(job) {
  const { faxId } = job.data;

  const fax = await OutboundFax.findOne({ faxId });
  if (!fax) return;

  const outageState = await providerOutageService.getOutageState(fax.provider);
  if (outageState === "open") {
    return; // Provider is in full outage → skip retry
  }

  // Exponential backoff
  const attempts = fax.attempts || 0;
  const delayMs = Math.min(60000, Math.pow(2, attempts) * 1000); // max 60s

  const now = Date.now();
  const nextAllowed = fax.lastAttemptAt ? fax.lastAttemptAt.getTime() + delayMs : 0;

  if (now < nextAllowed) {
    return; // Not ready yet
  }

  await OutboundFax.updateOne(
    { faxId },
    { $inc: { attempts: 1 }, $set: { lastAttemptAt: new Date() } }
  );

  await sendFaxService.sendFax(faxId);
};
