// src/services/faxStatusService.js
import OutboundFax from "../models/OutboundFax.js";
import { auditService } from "../audit/auditService.js";
import { providerOutageService } from "./providerOutageService.js";

export const faxStatusService = {
  /**
   * Mark fax as "sending" after provider accepts the job.
   */
  async markSending(faxId, providerResponse) {
    const fax = await OutboundFax.findOne({ faxId });
    if (!fax) throw new Error("Fax not found");

    fax.status = "sending";
    fax.sentAt = new Date();
    fax.providerMetadata = {
      ...fax.providerMetadata,
      providerJobId: providerResponse.jobId || providerResponse.id
    };

    await fax.save();

    await auditService.log({
      action: "FAX_STATUS_SENDING",
      faxId,
      provider: fax.provider,
      details: providerResponse
    });

    return fax;
  },

  /**
   * Handle provider webhook updates.
   * Normalizes provider payloads and updates fax status.
   */
  async updateFromProvider(event) {
    const normalized = normalizeProviderEvent(event);

    const fax = await OutboundFax.findOne({ faxId: normalized.faxId });
    if (!fax) throw new Error("Fax not found");

    // Update status
    fax.status = normalized.status;

    if (normalized.status === "delivered") {
      fax.deliveredAt = new Date();
    }

    if (normalized.status === "failed") {
      fax.errorCode = normalized.errorCode;
      fax.errorMessage = normalized.errorMessage;

      // Track provider outage if needed
      if (normalized.errorCode) {
        await providerOutageService.recordFailure(fax.provider);
      }
    }

    await fax.save();

    // Audit log
    await auditService.log({
      action: "FAX_STATUS_UPDATE",
      faxId: fax.faxId,
      provider: fax.provider,
      details: normalized
    });

    return fax;
  }
};

/**
 * Normalize provider webhook payloads.
 */
function normalizeProviderEvent(event) {
  return {
    faxId: event.faxId || event.id,
    status: mapProviderStatus(event.status),
    errorCode: event.errorCode || null,
    errorMessage: event.errorMessage || null
  };
}

/**
 * Map provider-specific statuses to FaxNova statuses.
 */
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
