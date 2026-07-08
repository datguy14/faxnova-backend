// src/providers/sinchProvider.js
// Sinch Provider — Strict‑Mode, Production‑Ready

const axios = require("axios");

const SINCH_BASE = "https://api.sinch.com/v1/projects";

/**
 * Build Basic Auth header
 */
function getAuthHeader() {
  const apiKey = process.env.SINCH_API_KEY;
  const apiSecret = process.env.SINCH_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("Sinch API credentials are not configured");
  }

  const token = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  return `Basic ${token}`;
}

/**
 * Build project base URL
 */
function getProjectBase() {
  const projectId = process.env.SINCH_PROJECT_ID;

  if (!projectId) {
    throw new Error("SINCH_PROJECT_ID is not configured");
  }

  return `${SINCH_BASE}/${projectId}`;
}

/**
 * Send a fax via Sinch
 */
async function sendFax({ to, from, mediaUrl, correlationId }) {
  const base = getProjectBase();
  const url = `${base}/faxes`;

  const payload = { to, from, mediaUrl };

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

    return {
      provider: "sinch",
      status: "error",
      error: {
        message: err.message,
        httpStatus: err.response?.status || null,
        raw: err.response?.data || null
      },
      diagnostics: {
        latencyMs,
        httpStatus: err.response?.status || null,
        requestId: err.response?.headers?.["x-request-id"] || null
      }
    };
  }
}

/**
 * Get fax status from Sinch
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

    return {
      provider: "sinch",
      status: "error",
      error: {
        message: err.message,
        httpStatus: err.response?.status || null,
        raw: err.response?.data || null
      },
      diagnostics: {
        latencyMs,
        httpStatus: err.response?.status || null,
        requestId: err.response?.headers?.["x-request-id"] || null
      }
    };
  }
}

/**
 * Provider health check (Sinch has no /health endpoint)
 * We use a lightweight GET /faxes?limit=1 as a safe ping.
 */
async function getHealth() {
  const base = getProjectBase();
  const url = `${base}/faxes?limit=1`;

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

    return {
      provider: "sinch",
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
