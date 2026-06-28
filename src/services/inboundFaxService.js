// src/services/inboundFaxService.js

const FaxNovaError = require("../errors/FaxNovaError");

// Unified provider adapters
const sinch = require("../providers/sinchAdapter");
const telnyx = require("../providers/telnyxAdapter");

// Provider map
const inboundMap = {
  sinch,
  telnyx
};

/**
 * Normalize inbound fax payload from provider adapters.
 * Each adapter MUST return:
 * {
 *   from,
 *   to,
 *   pages,
 *   mediaUrl,
 *   residencyZone,
 *   sovereignty,
 *   jobId,
 *   receivedAt
 * }
 */
function normalizeInbound(providerName, payload) {
  const provider = inboundMap[providerName];

  if (!provider) {
    throw new FaxNovaError("Invalid inbound provider", {
      code: "INBOUND_PROVIDER_INVALID",
      providerName
    });
  }

  const normalized = provider.normalizeInbound(payload);

  if (!normalized || !normalized.from || !normalized.to) {
    throw new FaxNovaError("Inbound fax normalization failed", {
      code: "INBOUND_NORMALIZATION_FAILED",
      providerName,
      payload
    });
  }

  return normalized;
}

/**
 * Handle inbound fax webhook
 */
async function handleInbound(providerName, payload) {
  try {
    // Normalize inbound fax
    const inbound = normalizeInbound(providerName, payload);

    return {
      from: inbound.from,
      to: inbound.to,
      pages: inbound.pages,
      mediaUrl: inbound.mediaUrl,
      residencyZone: inbound.residencyZone,
      sovereignty: inbound.sovereignty,
      jobId: inbound.jobId,
      receivedAt: inbound.receivedAt || new Date()
    };
  } catch (err) {
    throw new FaxNovaError("Inbound fax processing failed", {
      code: "INBOUND_PROCESSING_FAILED",
      providerName,
      details: err.message
    });
  }
}

module.exports = {
  handleInbound
};
