// src/providers/telnyxInboundAdapter.js
// Telnyx Inbound Adapter — Strict‑Mode

module.exports = async function telnyxInboundAdapter(event) {
  return {
    provider: "telnyx",
    type: event.data?.event_type,
    faxId: event.data?.payload?.fax_id,
    status: event.data?.payload?.status,
    direction: event.data?.payload?.direction,
    raw: event
  };
};
