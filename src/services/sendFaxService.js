// src/services/sendFaxService.js

const OutboundFax = require("../models/OutboundFax");
const providerRoutingEngine = require("./providerRoutingEngine");
const providerOutageService = require("./providerOutageService");
const providerPerformanceService = require("./providerPerformanceService");
const providerHealthService = require("./providerHealthService");

module.exports = {
  async sendFax(faxId) {
    const fax = await OutboundFax.findOne({ faxId });
    if (!fax) throw new Error(`Fax not found: ${faxId}`);

    const provider = await providerRoutingEngine.selectProviderForFax(fax);
    fax.provider = provider;
    await fax.save();

    try {
      const adapter = require(`../providers/${provider}Adapter`);
      const result = await adapter.sendFax(fax);

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

      return result;
    } catch (err) {
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
  }
};
