// src/providers/sinchAdapter.js

const axios = require("axios");
const FaxNovaError = require("../errors/FaxNovaError");
const sinchAuth = require("../auth/sinchAuth"); // your OAuth client-credentials module

/**
 * Sinch Fax Adapter (FaxNova v1)
 *
 * Responsibilities:
 * - Authenticate via OAuth client credentials
 * - Send outbound faxes
 * - Normalize inbound fax webhooks
 *
 * All methods return normalized, provider-safe objects.
 */

// Base Sinch API URL
const SINCH_BASE_URL = "https://fax.api.sinch.com/v1";

/**
 * Send fax via Sinch
 */
async function sendFax({ to, from, pages, documentUrl, residencyZone, tier }) {
  try {
    const token = await sinchAuth.getAccessToken();

    const payload = {
      to,
      from,
      documentUrl,
      pages,
      metadata: {
        residencyZone,
        tier
      }
    };

    const response = await axios.post(
      `${SINCH_BASE_URL}/faxes/send`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.data || !response.data.jobId) {
      throw new FaxNovaError("Invalid Sinch response", {
        code: "SINCH_INVALID_RESPONSE",
        response: response.data
      });
    }

    return {
      jobId: response.data.jobId
    };
  } catch (err) {
    throw new FaxNovaError("Sinch outbound fax failed", {
      code: "SINCH_OUTBOUND_FAILED",
      details: err.message
    });
  }
}

/**
 * Normalize inbound fax webhook from Sinch
 *
 * Expected Sinch inbound payload shape:
 * {
 *   from,
 *   to,
 *   pages,
 *   mediaUrl,
 *   jobId,
 *   receivedAt
 * }
 */
function normalizeInbound(payload) {
  try {
    if (!payload) {
      throw new FaxNovaError("Missing inbound payload", {
        code: "SINCH_INBOUND_PAYLOAD_MISSING"
      });
    }

    const {
      from,
      to,
      pages,
      mediaUrl,
      jobId,
      receivedAt
    } = payload;

    if (!from || !to) {
      throw new FaxNovaError("Invalid inbound fax payload", {
        code: "SINCH_INBOUND_INVALID",
        payload
      });
    }

    return {
      from,
      to,
      pages: pages || 1,
      mediaUrl: mediaUrl || null,
      residencyZone: "us", // Sinch inbound is US-based for FaxNova v1
      sovereignty: "domestic",
      jobId,
      receivedAt: receivedAt ? new Date(receivedAt) : new Date()
    };
  } catch (err) {
    throw new FaxNovaError("Sinch inbound normalization failed", {
      code: "SINCH_INBOUND_NORMALIZATION_FAILED",
      details: err.message
    });
  }
}

module.exports = {
  sendFax,
  normalizeInbound
};
