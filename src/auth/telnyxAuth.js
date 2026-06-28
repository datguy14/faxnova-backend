// src/auth/telnyxAuth.js

const axios = require("axios");
const FaxNovaError = require("../errors/FaxNovaError");

/**
 * Telnyx Authentication (FaxNova v1)
 *
 * Telnyx Fax API v2 uses API keys, not OAuth.
 * This module centralizes:
 * - API key validation
 * - Authorization header creation
 * - Safe request wrapper with retry on 401
 */

function getApiKey() {
  const apiKey = process.env.TELNYX_API_KEY;

  if (!apiKey) {
    throw new FaxNovaError("Missing Telnyx API key", {
      code: "TELNYX_API_KEY_MISSING"
    });
  }

  return apiKey;
}

/**
 * Build Authorization header
 */
function getAuthHeader() {
  const apiKey = getApiKey();
  return { Authorization: `Bearer ${apiKey}` };
}

/**
 * Wrapper for authenticated Telnyx requests
 */
async function telnyxRequest(axiosConfig) {
  try {
    const baseHeaders = axiosConfig.headers || {};
    const authHeader = getAuthHeader();

    const doRequest = async (headers) =>
      axios({
        ...axiosConfig,
        headers,
        timeout: axiosConfig.timeout || 10000,
        validateStatus: (status) => status < 500
      });

    // First attempt
    let resp = await doRequest({ ...baseHeaders, ...authHeader });

    // Retry once on 401 (rare for API-key auth, but safe)
    if (resp.status === 401) {
      const retryAuth = getAuthHeader();
      resp = await doRequest({ ...baseHeaders, ...retryAuth });
    }

    return resp;
  } catch (err) {
    throw new FaxNovaError("Telnyx request failed", {
      code: "TELNYX_REQUEST_FAILED",
      details: err.message
    });
  }
}

module.exports = {
  getApiKey,
  getAuthHeader,
  telnyxRequest
};
