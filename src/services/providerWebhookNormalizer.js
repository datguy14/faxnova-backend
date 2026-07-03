// src/services/providerWebhookNormalizer.js — STRICT-MODE VERSION

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

/**
 * SINCH WEBHOOK NORMALIZATION
 */
function normalizeSinch(payload) {
  const providerMessageId =
    payload?.id ||
    payload?.messageId ||
    payload?.metadata?.messageId ||
    null;

  const fromNumber =
    payload?.from ||
    payload?.source ||
    payload?.metadata?.from ||
    null;

  const toNumber =
    payload?.to ||
    payload?.destination ||
    payload?.metadata?.to ||
    null;

  const documentUrl =
    payload?.mediaUrl ||
    payload?.documentUrl ||
    payload?.metadata?.documentUrl ||
    null;

  return {
    provider: "sinch",
    direction: detectDirectionSinch(payload),
    faxId: payload?.metadata?.faxId || null,
    providerMessageId,
    fromNumber,
    toNumber,
    documentUrl,
    status: mapSinchStatus(payload?.event || payload?.status),
    errorMessage: payload?.errorMessage || null,
    rawPayload: payload,
    eventType: payload?.event || payload?.status || "unknown",
    externalEventId:
      payload?.eventId ||
      providerMessageId ||
      `${providerMessageId}-${payload?.event}`,
  };
}

function detectDirectionSinch(payload) {
  if (payload?.direction === "inbound") return "inbound";
  if (payload?.direction === "outbound") return "outbound";
  return payload?.from ? "inbound" : "outbound";
}

function mapSinchStatus(event = "") {
  const e = event.toLowerCase();
  if (e.includes("queued")) return "queued";
  if (e.includes("sending")) return "sending";
  if (e.includes("delivered")) return "delivered";
  if (e.includes("received")) return "received";
  if (e.includes("failed")) return "failed";
  return "unknown";
}

/**
 * TELNYX WEBHOOK NORMALIZATION
 */
function normalizeTelnyx(payload) {
  const data = payload?.data || {};

  const providerMessageId =
    data?.id ||
    data?.fax_id ||
    data?.payload?.fax_id ||
    null;

  const fromNumber =
    data?.from ||
    data?.payload?.from ||
    data?.metadata?.from ||
    null;

  const toNumber =
    data?.to ||
    data?.payload?.to ||
    data?.metadata?.to ||
    null;

  const documentUrl =
    data?.media_url ||
    data?.document_url ||
    data?.payload?.document_url ||
    null;

  return {
    provider: "telnyx",
    direction: detectDirectionTelnyx(payload),
    faxId: data?.metadata?.faxId || null,
    providerMessageId,
    fromNumber,
    toNumber,
    documentUrl,
    status: mapTelnyxStatus(payload?.eventType),
    errorMessage: data?.errors?.[0]?.detail || null,
    rawPayload: payload,
    eventType: payload?.eventType || "unknown",
    externalEventId:
      payload?.eventId ||
      providerMessageId ||
      `${providerMessageId}-${payload?.eventType}`,
  };
}

function detectDirectionTelnyx(payload) {
  const e = payload?.eventType?.toLowerCase() || "";
  if (e.includes("inbound")) return "inbound";
  if (e.includes("outbound")) return "outbound";
  return "outbound"; // Telnyx defaults to outbound unless specified
}

function mapTelnyxStatus(event = "") {
  const e = event.toLowerCase();
  if (e.includes("fax.queued")) return "queued";
  if (e.includes("fax.sending")) return "sending";
  if (e.includes("fax.delivered")) return "delivered";
  if (e.includes("fax.received")) return "received";
  if (e.includes("fax.failed")) return "failed";
  return "unknown";
}
