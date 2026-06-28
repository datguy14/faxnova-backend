// src/auth/sinchAuth.js

const axios = require("axios");
const FaxNovaError = require("../errors/FaxNovaError");

// Cached OAuth token + expiry
let accessToken = null;
let tokenExpiry = 0; // ms timestamp

/**
 * Fetch a new OAuth token from Sinch
 */
async function fetchNewToken() {
  try {
    const resp = await axios.post(
      "https://auth.sinch.com/oauth2/token",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.SINCH_KEY_ID,
        client_secret: process.env.SINCH_KEY_SECRET
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
        validateStatus: (status) => status < 500
      }
    );

    if (resp.status !== 200 || !resp.data?.access_token) {
      throw new FaxNovaError("Sinch OAuth error", {
        code: "SINCH_OAUTH_FAILED",
        details: resp.data?.error || resp.statusText
      });
    }

    accessToken = resp.data.access_token;

    const expiresInSec = resp.data.expires_in || 3600;
    tokenExpiry = Date.now() + (expiresInSec - 60) * 1000; // refresh 60s early

    return accessToken;
  } catch (err) {
    throw new FaxNovaError("Failed to obtain Sinch OAuth token", {
      code: "SINCH_TOKEN_FETCH_FAILED",
      details: err.message
    });
  }
}

/**
 * Get cached token or refresh if expired
 */
async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }
  return fetchNewToken();
}

/**
 * Build Authorization header
 */
async function getAuthHeader() {
  const token = await getAccessToken();
  return { Authorization: `Bearer ${token}` };
}

/**
 * Wrapper for authenticated Sinch requests
 */
async function sinchRequest(axiosConfig) {
  try {
    const baseHeaders = axiosConfig.headers || {};
    const authHeader = await getAuthHeader();

    const doRequest = async (headers) =>
      axios({
        ...axiosConfig,
        headers,
        timeout: axiosConfig.timeout || 10000,
        validateStatus: (status) => status < 500
      });

    // First attempt
    let resp = await doRequest({ ...baseHeaders, ...authHeader });

    // Retry once on 401
    if (resp.status === 401) {
      accessToken = null; // force refresh
      const retryAuth = await getAuthHeader();
      resp = await doRequest({ ...baseHeaders, ...retryAuth });
    }

    return resp;
  } catch (err) {
    throw new FaxNovaError("Sinch request failed", {
      code: "SINCH_REQUEST_FAILED",
      details: err.message
    });
  }
}

module.exports = {
  getAccessToken,
  getAuthHeader,
  sinchRequest
};
