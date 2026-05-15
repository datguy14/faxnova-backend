// sinchAuth.js
const axios = require('axios');

let accessToken = null;
let tokenExpiry = 0; // ms timestamp

async function fetchNewToken() {
  const resp = await axios.post(
    'https://auth.sinch.com/oauth2/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.SINCH_KEY_ID,
      client_secret: process.env.SINCH_KEY_SECRET,
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
      validateStatus: status => status < 500,
    }
  );

  if (resp.status !== 200 || !resp.data?.access_token) {
    const msg = resp.data?.error || resp.statusText || 'Failed to obtain Sinch token';
    throw new Error(`Sinch OAuth error: ${msg}`);
  }

  accessToken = resp.data.access_token;
  const expiresInSec = resp.data.expires_in || 3600;
  // refresh 60s early
  tokenExpiry = Date.now() + (expiresInSec - 60) * 1000;

  return accessToken;
}

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }
  return fetchNewToken();
}

async function getAuthHeader() {
  const token = await getAccessToken();
  return { Authorization: `Bearer ${token}` };
}

async function sinchRequest(axiosConfig) {
  const baseHeaders = axiosConfig.headers || {};
  const authHeader = await getAuthHeader();

  const doRequest = async (headers) =>
    axios({
      ...axiosConfig,
      headers,
      timeout: axiosConfig.timeout || 10000,
      validateStatus: status => status < 500,
    });

  let resp = await doRequest({ ...baseHeaders, ...authHeader });

  if (resp.status === 401) {
    // force refresh once
    accessToken = null;
    const retryAuth = await getAuthHeader();
    resp = await doRequest({ ...baseHeaders, ...retryAuth });
  }

  return resp;
}

module.exports = {
  getAccessToken,
  getAuthHeader,
  sinchRequest,
};
