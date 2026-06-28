// src/providers/telnyxAdapter.js

const axios = require("axios");
const FaxNovaError = require("../errors/FaxNovaError");

// Telnyx API base URL
const TELNYX_BASE_URL = "https://api.telnyx.com/v2";

/**
 * Telnyx Fax Adapter (FaxNova v1)
 *
 * Responsibilities:
 * - Send outbound faxes via Telnyx API v2
 * - Normalize inbound fax webhook events
 *
 * All methods return normalized, provider-safe objects.
 */

/**
 * Send fax via Telnyx
 */
async function sendFax({ to, from, pages, documentUrl, residencyZone, tier }) {
  try {
    const apiKey = process.env.TELNYX_API_KEY;

    if (!apiKey) {
      throw new FaxNovaError("Missing Telnyx API key", {
        code: "TELNYX_API_KEY_MISSING"
      });
    }

    const payload = {
      to,
      from,
      media_url: documentUrl,
      metadata: {
        pages,
        residencyZone,
        tier
      }
    };

    const response = await axios.post(
      `${TELNYX_BASE_URL}/faxes`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.data || !response.data.data || !response.data.data.id) {
      throw new FaxNovaError("Invalid Telnyx response", {
        code: "TELNYX_INVALID_RESPONSE",
        response: response.data
      });
    }

    return {
      jobId: response.data.data.id
    };
  } catch (err) {
    throw new FaxNovaError("Telnyx outbound fax failed", {
      code: "TELNYX_OUTBOUND_FAILED",
      details: err.message
    });
  }
}

/**
 * Normalize inbound fax webhook from Telnyx
 *
 * Expected Telnyx inbound payload shape:
 * {
 *   data: {
 *     id,
 *     to,
 *     from,
 *     pages,
 *     media_url,
 *     received_at
 *   }
 * }
 */
function normalizeInbound(payload) {
  try {
    if (!payload || !payload.data) {
      throw new FaxNovaError("Missing inbound payload", {
        code: "TELNYX_INBOUND_PAYLOAD_MISSING"
      });
    }

    const {
      id,
      to,
      from,
      pages,
      media_url,
      received_at
    } = payload.data;

    if (!from || !to) {
      throw new FaxNovaError("Invalid inbound fax payload", {
        code: "TELNYX_INBOUND_INVALID",
        payload
      });
    }

    return {
      from,
      to,
      pages: pages || 1,
      mediaUrl: media_url || null,
      residencyZone: "us", // Telnyx inbound is US-based for FaxNova v1
      sovereignty: "domestic",
      jobId: id,
      receivedAt: received_at ? new Date(received_at) : new Date()
    };
  } catch (err) {
    throw new FaxNovaError("Telnyx inbound normalization failed", {
      code: "TELNYX_INBOUND_NORMALIZATION_FAILED",
      details: err.message
    });
  }
}

module.exports = {
  sendFax,
  normalizeInbound
};
