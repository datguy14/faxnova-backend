// src/providers/telnyxAdapter.js — STRICT-MODE VERSION

const axios = require("axios");
const FaxNovaError = require("../errors/FaxNovaError");

/**
 * Telnyx outbound fax adapter
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
      process.env.TELNYX_FAX_ENDPOINT,
      {
        faxId,
        to,
        from,
        documentUrl,
        region
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TELNYX_API_KEY}`
        }
      }
    );

    return {
      provider: "telnyx",
      messageId: response.data.data.id,
      raw: response.data
    };

  } catch (err) {
    throw new FaxNovaError("Telnyx sendFax failed", {
      code: "TELNYX_SEND_FAILED",
      provider: "telnyx",
      details: err.message
    });
  }
}

/**
 * Telnyx inbound fax normalization
 */
async function handleInboundFax(payload) {
  return {
    provider: "telnyx",
    payload
  };
}

module.exports = {
  sendFax,
  handleInboundFax
};
