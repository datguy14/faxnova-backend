// src/providers/sinchInboundAdapter.js

/**
 * Sinch Inbound Adapter — Strict‑Mode Edition
 *
 * Normalizes inbound fax webhook payloads from Sinch.
 * No routing engine, no diagnostics, no sovereignty logic.
 */

exports.normalizeInboundFax = (payload) => {
  try {
    if (!payload || !payload.event || !payload.fax) {
      return { ok: false, error: "Invalid Sinch webhook payload" };
    }

    const event = payload.event;
    const fax = payload.fax;

    // Sinch inbound fax event type
    if (event.type !== "fax.received") {
      return { ok: false, error: `Unsupported Sinch event: ${event.type}` };
    }

    if (!fax.id) {
      return { ok: false, error: "Missing fax.id in Sinch payload" };
    }

    return {
      ok: true,
      provider: "sinch",
      providerFaxId: fax.id,
      from: fax.from || null,
      storageKey: fax.mediaUrl || null,
      region: fax.region || "us-east", // Sinch default region
      status: fax.status || "received",
      raw: payload
    };
  } catch (err) {
    return { ok: false, error: `Sinch normalization failed: ${err.message}` };
  }
};
