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
    return; // provider is in full outage → skip retry
  }

  await OutboundFax.updateOne(
    { faxId },
    { $inc: { attempts: 1 }, $set: { lastAttemptAt: new Date() } }
  );

  await sendFaxService.sendFax(faxId);
};
