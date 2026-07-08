// src/providers/inboundWebhookAdapter.js
// Strict‑Mode Multi‑Provider Inbound Fax Webhook Adapter

const { enqueueInboundFax } = require("../queues/inboundFaxQueue");

/**
 * Normalize inbound fax events into strict-mode shape:
 *
 * {
 *   provider: 'telnyx' | 'sinch' | 'custom',
 *   faxId: string,
 *   from: string,
 *   to: string,
 *   fileUrl: string,
 *   receivedAt: number,
 *   raw: any
 * }
 */

function normalizeTelnyx(body) {
  const data = body?.data?.payload;

  return {
    provider: "telnyx",
    faxId: `tx_${data?.fax_id || data?.id || "unknown"}`,
    from: data?.from || null,
    to: data?.to || null,
    fileUrl: data?.media_url || null,
    receivedAt: Date.now(),
    raw: body
  };
}

function normalizeSinch(body) {
  const data = body?.message;

  return {
    provider: "sinch",
    faxId: `sn_${data?.id || "unknown"}`,
    from: data?.from || null,
    to: data?.to || null,
    fileUrl: data?.fileUrl || null,
    receivedAt: Date.now(),
    raw: body
  };
}

function normalizeCustom(body) {
  return {
    provider: "custom",
    faxId: body?.faxId || `custom_${Date.now()}`,
    from: body?.from || null,
    to: body?.to || null,
    fileUrl: body?.fileUrl || null,
    receivedAt: Date.now(),
    raw: body
  };
}

module.exports = async (req, res) => {
  try {
    const path = req.path || "";
    const body = req.body;

    let normalized;

    if (path.includes("telnyx")) {
      normalized = normalizeTelnyx(body);
    } else if (path.includes("sinch")) {
      normalized = normalizeSinch(body);
    } else {
      normalized = normalizeCustom(body);
    }

    // Enqueue inbound fax for processing
    await enqueueInboundFax(normalized);

    return res.json({
      ok: true,
      received: true,
      provider: normalized.provider,
      faxId: normalized.faxId
    });
  } catch (err) {
    console.error("❌ inboundWebhookAdapter error:", err);

    return res.status(500).json({
      ok: false,
      error: "Inbound webhook processing failed"
    });
  }
};
