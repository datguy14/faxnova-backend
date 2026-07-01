// src/services/providerWebhookNormalizer.js

/**
 * Normalizes webhook payloads from Sinch and Telnyx
 * into a unified FaxNova event format.
 *
 * Output format:
 * {
 *   faxId: string,
 *   provider: "sinch" | "telnyx",
 *   providerFaxId: string,
 *   status: "queued" | "sending" | "delivered" | "failed",
 *   error: string | null,
 *   raw: object
 * }
 */

module.exports = {
  normalize(provider, payload) {
    switch (provider) {
      case "sinch":
        return normalizeSinch(payload);

      case "telnyx":
        return normalizeTelnyx(payload);

      default:
        throw new Error(`Unknown provider in webhook: ${provider}`);
    }
  },
};

// ---------------------------------------------------------
// SINCH WEBHOOK NORMALIZATION
// ---------------------------------------------------------
function normalizeSinch(payload) {
  const event = payload?.event || payload?.status || "unknown";

  return {
    faxId: payload?.metadata?.faxId || null,
    provider: "sinch",
    providerFaxId: payload?.id || payload?.faxId || null,
    status: mapSinchStatus(event),
    error: payload?.errorMessage || null,
    raw: payload,
  };
}

function mapSinchStatus(event) {
  const normalized = event.toLowerCase();

  if (normalized.includes("queued")) return "queued";
  if (normalized.includes("sending")) return "sending";
  if (normalized.includes("delivered")) return "delivered";
  if (normalized.includes("failed")) return "failed";

  return "failed"; // default fail-safe
}

// ---------------------------------------------------------
// TELNYX WEBHOOK NORMALIZATION
// ---------------------------------------------------------
function normalizeTelnyx(payload) {
  const data = payload?.data || {};
  const event = payload?.event_type || "unknown";

  return {
    faxId: data?.metadata?.faxId || null,
    provider: "telnyx",
    providerFaxId: data?.id || null,
    status: mapTelnyxStatus(event),
    error: data?.errors?.[0]?.detail || null,
    raw: payload,
  };
}

function mapTelnyxStatus(event) {
  const normalized = event.toLowerCase();

  if (normalized.includes("fax.queued")) return "queued";
  if (normalized.includes("fax.sending")) return "sending";
  if (normalized.includes("fax.delivered")) return "delivered";
  if (normalized.includes("fax.failed")) return "failed";

  return "failed"; // default fail-safe
}
