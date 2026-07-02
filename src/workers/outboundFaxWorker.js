// src/workers/outboundFaxWorker.js

const OutboundFax = require("../models/OutboundFax");
const sendFaxService = require("../services/sendFaxService");

module.exports = async function processOutboundFax(job) {
  const { faxId } = job.data;

  await OutboundFax.updateOne(
    { faxId },
    { $inc: { attempts: 1 }, $set: { lastAttemptAt: new Date() } }
  );

  await sendFaxService.sendFax(faxId);
};
