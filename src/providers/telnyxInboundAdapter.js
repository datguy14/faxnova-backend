// src/providers/telnyxInboundAdapter.js

exports.normalizeInbound = payload => {
  return {
    provider: "telnyx",
    providerFaxId: payload.data.id,
    from: payload.data.from,
    storageKey: payload.data.media_url,
    status: payload.data.status
  };
};
