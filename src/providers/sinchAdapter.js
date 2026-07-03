// src/providers/sinchAdapter.js — STRICT-MODE VERSION

const axios = require("axios");
const FaxNovaError = require("../errors/FaxNovaError");

/**
 * Sinch outbound fax adapter
 * - Pure provider API call
 * - No routing logic
 * - No outage/performance logic
 * - No circuit breaker logic
 *
 * All metrics + routing + failover are handled by:
 * - providerRoutingEngine
 * - providerCircuitBreaker
 * - sendFaxService
 * - retryFaxService
 */
async function sendFax({ faxId, to, from, documentUrl, region }) {
  try {
    const response = await axios.post(
      process.env.SINCH_FAX_ENDPOINT,
      {
        faxId,
        to,
        from,
        documentUrl,
        region
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SINCH_API_KEY}`
        }
      }
    );

    return {
      provider: "sinch",
      messageId: response.data.messageId,
      raw: response.data
    };

  } catch (err) {
    throw new FaxNovaError("Sinch sendFax failed", {
      code: "SINCH_SEND_FAILED",
      provider: "sinch",
      details: err.message
    });
  }
}

/**
 * Sinch inbound fax normalization
 */
async function handleInboundFax(payload) {
  return {
    provider: "sinch",
    payload
  };
}

module.exports = {
  sendFax,
  handleInboundFax
};
