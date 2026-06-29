// src/services/sendFaxService.js

const OutboundFax = require("../models/OutboundFax");
const providerRouter = require("../providers/providerRouter");
const providerPerformance = require("../services/providerPerformanceService");
const providerOutages = require("../services/providerOutageService");
const FaxNovaError = require("../errors/FaxNovaError");

async function sendFax({ tenantId, to, from, pages, documentUrl, tier, region }) {
  try {
    // Load real-time routing data
    const scores = await providerPerformance.getScores();
    const outages = await providerOutages.getOutageStates();

    // Determine residency zone from tenant or region
    const residencyZone = region === "eu" ? "eu" : "us";

    // Select provider
    const provider = providerRouter.selectProvider({
      residencyZone,
      sovereignty: region,
      scores,
      outages,
      retry: false
    });

    const adapter = providerRouter.getAdapter(provider);

    // Create DB record
    const faxRecord = await OutboundFax.create({
      tenantId,
      to,
      from,
      pages,
      documentUrl,
      provider,
      region,
      status: "sending",
      createdAt: new Date()
    });

    // Send fax via provider adapter
    const result = await adapter.sendFax({
      faxId: faxRecord.faxId,
      to,
      from,
      documentUrl
    });

    // Update DB
    await OutboundFax.updateOne(
      { faxId: faxRecord.faxId },
      {
        $set: {
          providerMessageId: result.messageId,
          status: "sent",
          updatedAt: new Date()
        }
      }
    );

    return result;

  } catch (err) {
    await providerOutages.recordFailure(err.provider);
    throw new FaxNovaError("sendFax failed", {
      code: "SEND_FAX_FAILED",
      details: err.message
    });
  }
}

module.exports = { sendFax };
