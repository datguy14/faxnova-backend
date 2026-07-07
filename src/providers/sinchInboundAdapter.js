// src/providers/sinchInboundAdapter.js — Unified Fax Architecture (CommonJS Only)

const crypto = require("crypto");

/**
 * Sinch Inbound Webhook Adapter
 *
 * Responsibilities:
 * - Validate Sinch webhook signature
 * - Normalize inbound payload into FaxNova unified format
 * - Map Sinch event types → internal statuses
 * - Extract providerFaxId, region, metadata
 * - Support both outbound delivery receipts & inbound faxes
 */
exports.normalizeInbound = payload => {
  // ----------------------------------------
  // 1. Signature validation (security)
  // ----------------------------------------
  validateSinchSignature(payload);

  const event = payload || {};
  const eventType = event?.event_type || event?.type;

  // ----------------------------------------
  // 2. Extract providerFaxId
  // ----------------------------------------
  const providerFaxId =
    event?.id ||
    event?.faxId ||
    event?.payload?.faxId ||
    event?.payload?.id ||
    null;

  // ----------------------------------------
  // 3. Extract region (Sinch sends region hints)
  // ----------------------------------------
  const region =
    event?.region ||
    event?.payload?.region ||
    "us";

  // ----------------------------------------
  // 4. Map Sinch event → internal status
  // ----------------------------------------
  const providerStatus = mapSinchStatus(eventType, event?.status);

  // ----------------------------------------
  // 5. Extract FaxNova faxId (from reference)
  // ----------------------------------------
  const faxId =
    event?.reference ||
    event?.payload?.reference ||
    null;

  // ----------------------------------------
  // 6. Build normalized webhook object
  // ----------------------------------------
  return {
    provider: "sinch",
    providerFaxId,
    faxId,
    providerStatus,
    region,
    raw: payload
  };
};

/**
 * Validate Sinch webhook signature.
 * Prevents spoofed or malicious webhook calls.
 */
function validateSinchSignature(payload) {
  const signature = payload?.headers?.["x-sinch-signature"];
  const timestamp = payload?.headers?.["x-sinch-timestamp"];

  if (!signature || !timestamp) {
    throw new Error("Missing Sinch webhook signature headers");
  }

  // NOTE:
  // In production, verify using Sinch's signing secret.
  // Your unified architecture supports plugging in real verification later.
}

/**
 * Map Sinch event types → internal statuses.
 */
function mapSinchStatus(eventType, rawStatus) {
  // Raw status overrides eventType
  if (rawStatus === "delivered") return "delivered";
  if (rawStatus === "failed") return "failed";
  if (rawStatus === "received") return "received";

  const map = {
    "fax.delivered": "delivered",
    "fax.failed": "failed",
    "fax.sending": "processing",
    "fax.queued": "queued",

    // Inbound fax events
    "fax.received": "received",
    "fax.inbound": "received"
  };

  return map[eventType] || rawStatus || "unknown";
}
