// src/services/faxStatusService.js

const FaxNovaError = require("../errors/FaxNovaError");
const OutboundFax = require("../models/OutboundFax");
const audit = require("../audit/auditService");
const providerOutageService = require("./providerOutageService");

/**
 * Normalize provider webhook payloads (Sinch + Telnyx unified)
 */
function normalize(event) {
  return {
    faxId: event.faxId || event.id,
    status: mapStatus(event.status),
    errorCode: event.errorCode || null,
    errorMessage: event.errorMessage || null
  };
}

/**
 * Map provider-specific statuses → FaxNova statuses
 */
function mapStatus(status) {
  const map = {
    queued: "queued",
    sending: "sending",
    in_progress: "sending",
    delivered: "delivered",
    success: "delivered",
    failed: "failed",
    error: "failed"
  };
  return map[status] || "failed";
}

async function updateFromProvider(event) {
  try {
    const n = normalize(event);

    const fax = await OutboundFax.findOne({ faxId: n.faxId });
    if (!fax) {
      throw new FaxNovaError("Fax not found", {
        code: "FAX_NOT_FOUND",
        faxId: n.faxId
      });
    }

    fax.status = n.status;

    if (n.status === "delivered") {
      fax.deliveredAt = new Date();
    }

    if (n.status === "failed") {
      fax.errorCode = n.errorCode;
      fax.errorMessage = n.errorMessage;

      if (n.errorCode) {
        await providerOutageService.recordFailure(fax.provider);
      }
    }

    await fax.save();

    audit.logEvent({
      tenantId: fax.tenantId,
      type: "fax_status",
      action: "update",
      details: {
        faxId: fax.faxId,
        provider: fax.provider,
        status: fax.status,
        errorCode: fax.errorCode,
        errorMessage: fax.errorMessage
      }
    });

    return fax;
  } catch (err) {
    throw new FaxNovaError("Fax status update failed", {
      code: "FAX_STATUS_UPDATE_FAILED",
      details: err.message
    });
  }
}

module.exports = {
  updateFromProvider
};
