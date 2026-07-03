// src/services/retryFaxService.js — STRICT-MODE VERSION

const OutboundFax = require("../models/OutboundFax");
const providerRoutingEngine = require("./providerRoutingEngine");
const providerOutageService = require("./providerOutageService");
const providerPerformanceService = require("./providerPerformanceService");
const FaxNovaError = require("../errors/FaxNovaError");
const providerApiService = require("./providerApiService");

async function retryFax(faxId, region) {
  try {
    const fax = await OutboundFax.findOne({ faxId });
    if (!fax) {
      throw new FaxNovaError("Fax not found for retry", {
        code: "FAX_NOT_FOUND",
        faxId
      });
    }

    // Strict-mode region handling
    const residencyZone = region === "eu" ? "eu" : "us";
    fax.region = residencyZone;

    // Strict-mode provider selection
    const provider = await providerRoutingEngine.selectProviderForFax({
      faxId,
      region: residencyZone,
      retry: true
    });

    // Send fax using strict-mode provider API
    const result = await providerApiService.sendFax({
      provider,
      faxId,
      to: fax.to,
      from: fax.from,
      documentUrl: fax.documentUrl,
      region: residencyZone
    });

    // Update fax record
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

    // Strict-mode outage + performance updates
    await providerOutageService.recordSuccess(provider);
    await providerPerformanceService.recordSuccess(provider);

    return result;

  } catch (err) {
    const provider = err.provider || "unknown";

    // Strict-mode failure updates
    await providerOutageService.recordFailure(provider);
    await providerPerformanceService.recordFailure(provider);

    throw new FaxNovaError("retryFax failed", {
      code: "RETRY_FAX_FAILED",
      provider,
      details: err.message
    });
  }
}

module.exports = { retryFax };
