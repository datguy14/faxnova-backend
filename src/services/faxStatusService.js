const OutboundFax = require("../models/OutboundFax");
const audit = require("../audit/auditService");
const providerOutageService = require("./providerOutageService");

const faxStatusService = {
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

    await audit.logEvent({
      type: "fax",
      action: "fax_status_sending",
      faxId,
      provider: fax.provider,
      details: providerResponse
    });

    return fax;
  },

  async updateFromProvider(event) {
    const normalized = normalizeProviderEvent(event);

    const fax = await OutboundFax.findOne({ faxId: normalized.faxId });
    if (!fax) throw new Error("Fax not found");

    fax.status = normalized.status;

    if (normalized.status === "delivered") {
      fax.deliveredAt = new Date();
    }

    if (normalized.status === "failed") {
      fax.errorCode = normalized.errorCode;
      fax.errorMessage = normalized.errorMessage;

      if (normalized.errorCode) {
        await providerOutageService.recordFailure(fax.provider);
      }
    }

    await fax.save();

    await audit.logEvent({
      type: "fax",
      action: "fax_status_update",
      faxId: fax.faxId,
      provider: fax.provider,
      details: normalized
    });

    return fax;
  }
};

function normalizeProviderEvent(event) {
  return {
    faxId: event.faxId || event.id,
    status: mapProviderStatus(event.status),
    errorCode: event.errorCode || null,
    errorMessage: event.errorMessage || null
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

module.exports = faxStatusService;
