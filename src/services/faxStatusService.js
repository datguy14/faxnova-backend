// src/services/faxStatusService.js
// Unified Fax Status Service — Strict‑Mode

const telnyx = require("../providers/telnyxProvider");
const sinch = require("../providers/sinchProvider");
const normalizeStatus = require("../utils/normalizeStatus");

/**
 * Detect provider based on faxId format
 * telnyx-123 → telnyx
 * sinch-123  → sinch
 */
function detectProvider(faxId) {
  if (faxId.startsWith("telnyx-")) return "telnyx";
  if (faxId.startsWith("sinch-")) return "sinch";
  return null;
}

/**
 * Fetch fax status from the correct provider
 */
async function getFaxStatus(faxId) {
  const provider = detectProvider(faxId);

  if (!provider) {
    throw new Error(`Unable to detect provider for faxId: ${faxId}`);
  }

  let rawStatus;

  if (provider === "telnyx") {
    rawStatus = await telnyx.getFaxStatus(faxId);
  }

  if (provider === "sinch") {
    rawStatus = await sinch.getFaxStatus(faxId);
  }

  return {
    provider,
    faxId,
    status: normalizeStatus(rawStatus),
    raw: rawStatus
  };
}

module.exports = {
  getFaxStatus
};
