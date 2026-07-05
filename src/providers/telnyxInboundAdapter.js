// src/providers/telnyxInboundAdapter.js

/**
 * Telnyx Inbound Adapter — Strict‑Mode Edition
 *
 * Normalizes inbound fax webhook payloads from Telnyx.
 * No routing engine, no diagnostics, no sovereignty logic.
 */

exports.normalizeInboundFax = (payload) => {
  try {
    if (!payload || !payload.data || !payload.data.event_type) {
      return { ok: false, error: "Invalid Telnyx webhook payload" };
    }

    const event = payload.data;

    // Telnyx fax events use event_type: "fax.received"
    if (event.event_type !== "fax.received") {
      return { ok: false, error: `Unsupported Telnyx event: ${event.event_type}` };
    }

    const fax = event.payload;

    if (!fax || !fax.fax_id) {
      return { ok: false, error: "Missing fax_id in Telnyx payload" };
    }

    return {
      ok: true,
      provider: "telnyx",
      providerFaxId: fax.fax_id,
      from: fax.from || null,
      storageKey: fax.media_url || null,
      region: fax.region || "us-east", // Telnyx default region
      status: fax.status || "received",
      raw: payload
    };
  } catch (err) {
    return { ok: false, error: `Telnyx normalization failed: ${err.message}` };
  }
};
