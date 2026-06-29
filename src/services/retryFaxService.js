// src/services/retryFaxService.js

const OutboundFax = require("../models/OutboundFax");
const providerRouter = require("../providers/providerRouter");
const providerPerformance = require("../services/providerPerformanceService");
const providerOutages = require("../services/providerOutageService");
const FaxNovaError = require("../errors/FaxNovaError");

async function retryFax(faxId, region) {
  try {
    const fax = await OutboundFax.findOne({ faxId });
    if (!fax) {
      throw new FaxNovaError("Fax not found for retry", {
        code: "FAX_NOT_FOUND",
        faxId
      });
    }

    const scores = await providerPerformance.getScores();
    const outages = await providerOutages.getOutageStates();

    const residencyZone = region === "eu" ? "eu" : "us";

    // Select provider with retry flag
    const provider = providerRouter.selectProvider({
      residencyZone,
      sovereignty: region,
      scores,
      outages,
      retry: true
    });

    const adapter = providerRouter.getAdapter(provider);

    const result = await adapter.sendFax({
      faxId,
      to: fax.to,
      from: fax.from,
      documentUrl: fax.documentUrl
    });

    await OutboundFax.updateOne(
      { faxId },
      {
        $set: {
          provider,
          providerMessageId: result.messageId,
          status: "sent",
          updatedAt: new Date()
        }
      }
    );

    await providerOutages.recordSuccess(provider);

    return result;

  } catch (err) {
    await providerOutages.recordFailure(err.provider);
    throw new FaxNovaError("retryFax failed", {
      code: "RETRY_FAX_FAILED",
      details: err.message
    });
  }
}

module.exports = { retryFax };
