// src/services/faxStatusService.js

const FaxNovaError = require("../errors/FaxNovaError");
const OutboundFax = require("../models/OutboundFax");
const providerOutageService = require("./providerOutageService");
const audit = require("../audit/auditService");

/**
 * Fax Status Service (FaxNova v1)
 *
 * Responsibilities:
 * - Normalize provider webhook events
 * - Update outbound fax status
 * - Track provider outages
 * - Audit log status changes
 */

function normalizeProviderEvent(provider, event) {
  if (!event) {
    throw new FaxNovaError("Missing provider event payload", {
      code: "STATUS_EVENT_MISSING"
    });
  }

  // Unified normalization for Sinch + Telnyx
  return {
    faxId: event.faxId || event.id || event.jobId,
    status: mapProviderStatus(event.status),
    errorCode: event.errorCode || event.error || null,
    errorMessage: event.errorMessage || event.message || null,
    raw: event
  };
}

function mapProviderStatus(status) {
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

async function updateFromProvider(provider, event) {
  try {
    const normalized = normalizeProviderEvent(provider, event);

    const fax = await OutboundFax.findOne({ jobId: normalized.faxId });

    if (!fax) {
      throw new FaxNovaError("Outbound fax not found for status update", {
        code: "FAX_NOT_FOUND",
        faxId: normalized.faxId
      });
    }

    // Update status
    fax.status = normalized.status;

    if (normalized.status === "delivered") {
      fax.deliveredAt = new Date();
    }

    if (normalized.status === "failed") {
      fax.errorCode = normalized.errorCode;
      fax.errorMessage = normalized.errorMessage;

      // Track provider outage
      if (normalized.errorCode) {
        await providerOutageService.recordFailure(provider);
      }
    }

    await fax.save();

    // Audit log
    audit.logEvent({
      tenantId: fax.tenantId,
      type: "fax_status",
      action: "update",
      details: {
        provider,
        faxId: fax.jobId,
        status: fax.status,
        errorCode: fax.errorCode,
        errorMessage: fax.errorMessage
      }
    });

    return fax;
  } catch (err) {
    throw new FaxNovaError("Fax status update failed", {
      code: "FAX_STATUS_FAILED",
      details: err.message
    });
  }
}

module.exports = {
  updateFromProvider
};
