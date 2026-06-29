// src/services/faxStatusService.js

const OutboundFax = require("../models/OutboundFax");
const providerOutageService = require("./providerOutageService");
const providerPerformanceService = require("./providerPerformanceService");
const FaxNovaError = require("../errors/FaxNovaError");

async function updateFaxStatus({ faxId, provider, providerStatus, unifiedStatus }) {
  try {
    const fax = await OutboundFax.findOne({ faxId });
    if (!fax) {
      throw new FaxNovaError("OutboundFax not found", {
        code: "FAX_NOT_FOUND",
        faxId
      });
    }

    // Update fax record
    fax.status = unifiedStatus;
    fax.providerStatus = providerStatus;
    fax.updatedAt = new Date();
    await fax.save();

    // Provider performance tracking
    if (unifiedStatus === "failed") {
      await providerOutageService.recordFailure(provider);
      await providerPerformanceService.applyFailurePenalty(provider);
    } else if (["sent", "delivered"].includes(unifiedStatus)) {
      await providerOutageService.recordSuccess(provider);
      await providerPerformanceService.applySuccessBoost(provider);
    }

    return {
      success: true,
      faxId,
      status: unifiedStatus
    };
  } catch (err) {
    throw new FaxNovaError("Failed to update fax status", {
      code: "FAX_STATUS_UPDATE_FAILED",
      details: err.message
    });
  }
}

module.exports = {
  updateFaxStatus
};
