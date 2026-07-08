// src/providers/telnyxProvider.js
// Telnyx Provider — Strict‑Mode, Production‑Ready

const axios = require("axios");

const TELNYX_BASE = "https://api.telnyx.com/v2";

/**
 * Build Telnyx Bearer token header
 */
function getAuthHeader() {
  const apiKey = process.env.TELNYX_API_KEY;

  if (!apiKey) {
    throw new Error("TELNYX_API_KEY is not configured");
  }

  return `Bearer ${apiKey}`;
}

/**
 * Send a fax via Telnyx
 */
async function sendFax({ to, from, mediaUrl, correlationId }) {
  const url = `${TELNYX_BASE}/faxes`;

  const payload = {
    to,
    from,
    media_url: mediaUrl
  };

  const headers = {
    Authorization: getAuthHeader(),
    "Content-Type": "application/json"
  };

  if (correlationId) {
    headers["X-Correlation-Id"] = correlationId;
  }

  const startedAt = Date.now();

  try {
    const res = await axios.post(url, payload, { headers });

    const latencyMs = Date.now() - startedAt;

    return {
      provider: "telnyx",
      status: "accepted",
      faxId: res.data.data.id,
      raw: res.data,
      diagnostics: {
        latencyMs,
        httpStatus: res.status,
        requestId: res.headers["telnyx-request-id"] || null
      }
    };
  } catch (err) {
    const latencyMs = Date.now() - startedAt;

    return {
      provider: "telnyx",
      status: "error",
      error: {
        message: err.message,
        httpStatus: err.response?.status || null,
        raw: err.response?.data || null
      },
      diagnostics: {
        latencyMs,
        httpStatus: err.response?.status || null,
        requestId: err.response?.headers?.["telnyx-request-id"] || null
      }
    };
  }
}

/**
 * Get fax status from Telnyx
 */
async function getFaxStatus(faxId) {
  const url = `${TELNYX_BASE}/faxes/${faxId}`;

  const headers = {
    Authorization: getAuthHeader(),
    "Content-Type": "application/json"
  };

  const startedAt = Date.now();

  try {
    const res = await axios.get(url, { headers });

    const latencyMs = Date.now() - startedAt;

    return {
      provider: "telnyx",
      status: res.data.data.status || "unknown",
      raw: res.data,
      diagnostics: {
        latencyMs,
        httpStatus: res.status,
        requestId: res.headers["telnyx-request-id"] || null
      }
    };
  } catch (err) {
    const latencyMs = Date.now() - startedAt;

    return {
      provider: "telnyx",
      status: "error",
      error: {
        message: err.message,
        httpStatus: err.response?.status || null,
        raw: err.response?.data || null
      },
      diagnostics: {
        latencyMs,
        httpStatus: err.response?.status || null,
        requestId: err.response?.headers?.["telnyx-request-id"] || null
      }
    };
  }
}

/**
 * Provider health check
 * Telnyx DOES have a lightweight /faxes endpoint we can ping.
 */
async function getHealth() {
  const url = `${TELNYX_BASE}/faxes?page[size]=1`;

  const headers = {
    Authorization: getAuthHeader(),
    "Content-Type": "application/json"
  };

  const startedAt = Date.now();

  try {
    const res = await axios.get(url, { headers });

    const latencyMs = Date.now() - startedAt;

    return {
      provider: "telnyx",
      healthy: true,
      latencyMs,
      httpStatus: res.status,
      raw: res.data
    };
  } catch (err) {
    const latencyMs = Date.now() - startedAt;

    return {
      provider: "telnyx",
      healthy: false,
      latencyMs,
      httpStatus: err.response?.status || null,
      error: {
        message: err.message,
        raw: err.response?.data || null
      }
    };
  }
}

/**
 * Diagnostics for routing engine
 */
async function getDiagnostics() {
  const health = await getHealth();

  const baseScore = health.healthy ? 1 : 0;
  const latencyPenalty = Math.min(health.latencyMs / 1000, 5);

  const score = baseScore - latencyPenalty;

  return {
    provider: "telnyx",
    healthy: health.healthy,
    latencyMs: health.latencyMs,
    httpStatus: health.httpStatus,
    score,
    raw: health.raw || health.error
  };
}

module.exports = {
  sendFax,
  getFaxStatus,
  getHealth,
  getDiagnostics
};
