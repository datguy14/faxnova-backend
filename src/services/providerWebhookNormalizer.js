// src/services/providerWebhookNormalizer.js

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

function normalizeSinch(payload) {
  return {
    faxId: payload?.metadata?.faxId || null,
    provider: "sinch",
    providerFaxId: payload?.id || null,
    status: mapSinchStatus(payload?.event || payload?.status),
    error: payload?.errorMessage || null,
    raw: payload,

    externalEventId: payload?.eventId || payload?.id || `${payload?.id}-${payload?.event}`,
  };
}

function mapSinchStatus(event = "") {
  const e = event.toLowerCase();
  if (e.includes("queued")) return "queued";
  if (e.includes("sending")) return "sending";
  if (e.includes("delivered")) return "delivered";
  if (e.includes("failed")) return "failed";
  return "failed";
}

function normalizeTelnyx(payload) {
  const data = payload?.data || {};
  return {
    faxId: data?.metadata?.faxId || null,
    provider: "telnyx",
    providerFaxId: data?.id || null,
    status: mapTelnyxStatus(payload?.event_type),
    error: data?.errors?.[0]?.detail || null,
    raw: payload,

    externalEventId: payload?.event_id || data?.id || `${data?.id}-${payload?.event_type}`,
  };
}

function mapTelnyxStatus(event = "") {
  const e = event.toLowerCase();
  if (e.includes("fax.queued")) return "queued";
  if (e.includes("fax.sending")) return "sending";
  if (e.includes("fax.delivered")) return "delivered";
  if (e.includes("fax.failed")) return "failed";
  return "failed";
}
