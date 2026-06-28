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
    faxId: event.faxId || event.id || event.external_id,   // unified FaxNova ID
    jobId: event.jobId || event.provider_job_id || null,   // provider job ID
    status: mapStatus(event.status),
    errorCode: event.errorCode || event.error_code || null,
    errorMessage: event.errorMessage || event.error_message || null
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

    if (!n.faxId) {
      throw new FaxNovaError("Missing faxId in provider status event", {
        code: "STATUS_FAXID_MISSING",
        event
      });
    }

    // Unified outbound fax lookup
    const fax = await OutboundFax.findOne({ faxId: n.faxId });
    if (!fax) {
      throw new FaxNovaError("Outbound fax not found", {
        code: "OUTBOUND_FAX_NOT_FOUND",
        faxId: n.faxId
      });
    }

    // Update status
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

    // Audit
    audit.logEvent({
      tenantId: fax.tenantId,
      type: "fax_status",
      action: "update",
      details: {
        faxId: fax.faxId,
        provider: fax.provider,
        jobId: fax.jobId,
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
