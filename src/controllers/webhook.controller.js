// webhookController.js

const providerHealthService = require("../services/providerHealthService");
const providerPerformanceService = require("../services/providerPerformanceService");
const faxService = require("../services/faxService");
const inboundFaxService = require("../services/inboundFaxService");
const providerRoutingEngine = require("../services/providerRoutingEngine");

module.exports = {
  // ---------------------------------------------------------
  // SINCH OUTBOUND CALLBACK
  // ---------------------------------------------------------
  async handleSinchOutbound(payload) {
    const normalized = {
      provider: "sinch",
      faxId: payload.messageId || payload.faxId,
      status: payload.status,
      error: payload.errorCode || null,
      raw: payload
    };

    await this._processOutbound(normalized);
  },

  // ---------------------------------------------------------
  // TELNYX OUTBOUND CALLBACK
  // ---------------------------------------------------------
  async handleTelnyxOutbound(payload) {
    const normalized = {
      provider: "telnyx",
      faxId: payload.data?.payload?.fax_id,
      status: payload.data?.payload?.status,
      error: payload.data?.payload?.errors || null,
      raw: payload
    };

    await this._processOutbound(normalized);
  },

  // ---------------------------------------------------------
  // INBOUND FAX CALLBACK (Sinch or Telnyx)
  // ---------------------------------------------------------
  async handleInboundFax(payload) {
    const normalized = {
      provider: payload.provider || "unknown",
      from: payload.from || payload.caller_id,
      to: payload.to || payload.destination,
      faxId: payload.faxId || payload.messageId,
      raw: payload
    };

    await inboundFaxService.storeInboundFax(normalized);
  },

  // ---------------------------------------------------------
  // DELIVERY RECEIPT (Unified)
  // ---------------------------------------------------------
  async handleDeliveryReceipt(payload) {
    const normalized = {
      provider: payload.provider,
      faxId: payload.faxId,
      delivered: payload.delivered === true,
      timestamp: payload.timestamp || Date.now(),
      raw: payload
    };

    if (normalized.delivered) {
      providerPerformanceService.applySuccessBoost(normalized.provider);
      providerHealthService.setHealth(normalized.provider, "healthy");
    }

    await faxService.updateFaxStatus(normalized.faxId, "delivered");
  },

  // ---------------------------------------------------------
  // PROVIDER ERROR / FAILURE
  // ---------------------------------------------------------
  async handleProviderError(payload) {
    const normalized = {
      provider: payload.provider,
      faxId: payload.faxId,
      error: payload.error,
      raw: payload
    };

    providerPerformanceService.applyFailurePenalty(normalized.provider);
    providerHealthService.setHealth(normalized.provider, "degraded");

    await faxService.updateFaxStatus(normalized.faxId, "failed");
  },

  // ---------------------------------------------------------
  // INTERNAL OUTBOUND PROCESSOR (Normalization Target)
  // ---------------------------------------------------------
  async _processOutbound(event) {
    const { provider, faxId, status, error } = event;

    // Update fax status
    await faxService.updateFaxStatus(faxId, status);

    // Provider scoring + health
    if (status === "delivered" || status === "success") {
      providerPerformanceService.applySuccessBoost(provider);
      providerHealthService.setHealth(provider, "healthy");
    }

    if (status === "failed" || error) {
      providerPerformanceService.applyFailurePenalty(provider);
      providerHealthService.setHealth(provider, "degraded");
    }

    // Sovereignty routing engine can log or adjust routing
    providerRoutingEngine.recordEvent(provider, {
      faxId,
      status,
      error
    });
  }
};
