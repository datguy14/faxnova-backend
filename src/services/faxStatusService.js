// src/services/faxStatusService.js
// Strict‑Mode Multi‑Provider Fax Status Service

const { telnyx, sinch } = require("../providers");

/**
 * Normalize provider-specific status into FaxNova strict-mode shape.
 *
 * Output shape:
 * {
 *   provider: 'telnyx' | 'sinch',
 *   faxId: string,
 *   status: 'queued' | 'processing' | 'delivered' | 'failed' | 'unknown',
 *   raw: any,
 *   diagnostics: {
 *     healthy: boolean,
 *     latencyMs: number,
 *     httpStatus: number | null,
 *     score: number
 *   }
 * }
 */
function normalizeStatus(providerName, rawStatus) {
  if (!rawStatus) {
    return {
      provider: providerName,
      faxId: null,
      status: "unknown",
      raw: null,
      diagnostics: {
        healthy: false,
        latencyMs: Infinity,
        httpStatus: null,
        score: -10
      }
    };
  }

  return {
    provider: providerName,
    faxId: rawStatus.faxId || null,
    status: rawStatus.status || "unknown",
    raw: rawStatus.raw || rawStatus,
    diagnostics: rawStatus.diagnostics || {
      healthy: false,
      latencyMs: Infinity,
      httpStatus: null,
      score: -10
    }
  };
}

/**
 * Detect provider from faxId prefix.
 * Telnyx: "tx_..."
 * Sinch: "sn_..."
 */
function detectProvider(faxId) {
  if (!faxId) return null;

  if (faxId.startsWith("tx_")) return "telnyx";
  if (faxId.startsWith("sn_")) return "sinch";

  return null;
}

/**
 * Fetch fax status from the correct provider.
 */
async function getFaxStatus(faxId) {
  const providerName = detectProvider(faxId);

  if (!providerName) {
    return {
      provider: "unknown",
      faxId,
      status: "unknown",
      raw: null,
      diagnostics: {
        healthy: false,
        latencyMs: Infinity,
        httpStatus: null,
        score: -10
      }
    };
  }

  const providerClient = providerName === "telnyx" ? telnyx : sinch;

  try {
    const rawStatus = await providerClient.getFaxStatus(faxId);
    return normalizeStatus(providerName, rawStatus);
  } catch (err) {
    return {
      provider: providerName,
      faxId,
      status: "failed",
      raw: { error: err.message },
      diagnostics: {
        healthy: false,
        latencyMs: Infinity,
        httpStatus: null,
        score: -10
      }
    };
  }
}

module.exports = {
  getFaxStatus
};
