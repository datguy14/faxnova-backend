// src/providers/sinchInboundAdapter.js
// Sinch Inbound Adapter — Strict‑Mode

module.exports = async function sinchInboundAdapter(event) {
  return {
    provider: "sinch",
    type: event.event || event.type,
    faxId: event.faxId || event.id,
    status: event.status,
    direction: event.direction || "inbound",
    raw: event
  };
};
