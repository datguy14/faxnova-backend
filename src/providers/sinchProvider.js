// src/providers/sinchProvider.js
const axios = require("axios");
const crypto = require("crypto");

const SINCH_BASE = "https://api.sinch.com/v1/projects";

function getAuthHeader() {
  const apiKey = process.env.SINCH_API_KEY;
  const apiSecret = process.env.SINCH_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("Sinch API credentials are not configured");
  }

  const token = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  return `Basic ${token}`;
}

function getProjectBase() {
  const projectId = process.env.SINCH_PROJECT_ID;

  if (!projectId) {
    throw new Error("SINCH_PROJECT_ID is not configured");
  }

  return `${SINCH_BASE}/${projectId}`;
}

/**
 * Send a fax via Sinch
 *
 * @param {Object} params
 * @param {string} params.to        - Destination fax number (E.164)
 * @param {string} params.from      - Source fax number (E.164)
 * @param {string} params.mediaUrl  - URL to the fax document (PDF, TIFF, etc.)
 * @param {string} [params.correlationId] - Optional correlation ID for tracing
 */
async function sendFax({ to, from, mediaUrl, correlationId }) {
  const base = getProjectBase();
  const url = `${base}/faxes`;

  const payload = {
    to,
    from,
    mediaUrl
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
      provider: "sinch",
      status: "accepted",
      faxId: res.data.id,
      raw: res.data,
      diagnostics: {
        latencyMs,
        httpStatus: res.status,
        requestId: res.headers["x-request-id"] || null
      }
    };
  } catch (err) {
    const latencyMs = Date.now() - startedAt;

    const status = err.response ? err.response.status : null;
    const data = err.response ? err.response.data : null;

    return {
      provider: "sinch",
      status: "error",
      error: {
        message: err.message,
        httpStatus: status,
        raw: data
      },
      diagnostics: {
        latencyMs,
        httpStatus: status,
        requestId: err.response?.headers?.["x-request-id"] || null
      }
    };
  }
}

/**
 * Get fax status from Sinch
 *
 * @param {string} faxId - Sinch fax ID
 */
async function getFaxStatus(faxId) {
  const base = getProjectBase();
  const url = `${base}/faxes/${faxId}`;

  const headers = {
    Authorization: getAuthHeader(),
    "Content-Type": "application/json"
  };

  const startedAt = Date.now();

  try {
    const res = await axios.get(url, { headers });

    const latencyMs = Date.now() - startedAt;

    return {
      provider: "sinch",
      status: res.data.status || "unknown",
      raw: res.data,
      diagnostics: {
        latencyMs,
        httpStatus: res.status,
        requestId: res.headers["x-request-id"] || null
      }
    };
  } catch (err) {
    const latencyMs = Date.now() - startedAt;

    const status = err.response ? err.response.status : null;
    const data = err.response ? err.response.data : null;

    return {
      provider: "sinch",
      status: "error",
      error: {
        message: err.message,
        httpStatus: status,
        raw: data
      },
      diagnostics: {
        latencyMs,
        httpStatus: status,
        requestId: err.response?.headers?.["x-request-id"] || null
      }
    };
  }
}

/**
 * Health check for Sinch provider
 * Returns a normalized health object for your routing engine.
 */
async function getHealth() {
  const base = getProjectBase();
  const url = `${base}/health`;

  const headers = {
    Authorization: getAuthHeader(),
    "Content-Type": "application/json"
  };

  const startedAt = Date.now();

  try {
    const res = await axios.get(url, { headers });

    const latencyMs = Date.now() - startedAt;

    return {
      provider: "sinch",
      healthy: true,
      latencyMs,
      httpStatus: res.status,
      raw: res.data
    };
  } catch (err) {
    const latencyMs = Date.now() - startedAt;

    const status = err.response ? err.response.status : null;
    const data = err.response ? err.response.data : null;

    return {
      provider: "sinch",
      healthy: false,
      latencyMs,
      httpStatus: status,
      error: {
        message: err.message,
        raw: data
      }
    };
  }
}

/**
 * Normalize diagnostics for routing engine
 * Example shape: { provider, latencyMs, healthy, score }
 */
async function getDiagnostics() {
  const health = await getHealth();

  // Simple scoring: healthy + latency
  const baseScore = health.healthy ? 1 : 0;
  const latencyPenalty = Math.min(health.latencyMs / 1000, 5); // up to -5

  const score = baseScore - latencyPenalty;

  return {
    provider: "sinch",
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
