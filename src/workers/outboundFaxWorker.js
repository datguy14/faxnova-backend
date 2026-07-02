// src/workers/outboundFaxWorker.js

const OutboundFax = require("../models/OutboundFax");
const providerRoutingEngine = require("../services/providerRoutingEngine");
const providerPerformanceService = require("../services/providerPerformanceService");
const providerOutageService = require("../services/providerOutageService");
const providerHealthService = require("../services/providerHealthService");
const redis = require("../lib/redis");

module.exports = async function processOutboundFax(job) {
  const { faxId } = job.data;

  const fax = await OutboundFax.findOne({ faxId });
  if (!fax) {
    console.error("Fax not found:", faxId);
    return;
  }

  // Increment attempts
  await OutboundFax.updateOne(
    { faxId },
    { $inc: { attempts: 1 }, $set: { lastAttemptAt: new Date() } }
  );

  // Select provider
  const provider = await providerRoutingEngine.selectProviderForFax(fax);

  fax.provider = provider;
  await fax.save();

  try {
    // Send fax via provider adapter
    const adapter = require(`../providers/${provider}Adapter`);
    const result = await adapter.sendFax(fax);

    // Provider success feedback
    await providerPerformanceService.applySuccessBoost(provider);
    await providerOutageService.recordSuccess(provider);
    await providerHealthService.evaluate(provider);

    await OutboundFax.updateOne(
      { faxId },
      {
        status: "sending",
        providerMessageId: result.messageId
      }
    );

  } catch (err) {
    // Provider failure feedback
    await providerPerformanceService.applyFailurePenalty(provider);
    await providerOutageService.recordFailure(provider);
    await providerHealthService.evaluate(provider);

    await OutboundFax.updateOne(
      { faxId },
      {
        status: "failed",
        errorMessage: err.message,
        errorCode: err.code || "SEND_FAILED"
      }
    );

    throw err;
  }
};
