// src/providers/sinchInboundAdapter.js

exports.normalizeInbound = payload => {
  return {
    provider: "sinch",
    providerFaxId: payload.id,
    from: payload.from,
    storageKey: payload.document,
    status: payload.status
  };
};
