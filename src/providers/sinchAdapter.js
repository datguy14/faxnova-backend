// src/providers/sinchAdapter.js
// Sinch Outbound Adapter — Strict‑Mode

module.exports = function sinchOutboundAdapter(payload) {
  return {
    to: payload.to,
    from: payload.from,
    mediaUrl: payload.mediaUrl,
    correlationId: payload.correlationId || `sinch-${Date.now()}`
  };
};
