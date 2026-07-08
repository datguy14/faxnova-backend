// src/providers/telnyxAdapter.js
// Telnyx Outbound Adapter — Strict‑Mode

module.exports = function telnyxOutboundAdapter(payload) {
  return {
    to: payload.to,
    from: payload.from,
    mediaUrl: payload.mediaUrl,
    correlationId: payload.correlationId || `telnyx-${Date.now()}`
  };
};
