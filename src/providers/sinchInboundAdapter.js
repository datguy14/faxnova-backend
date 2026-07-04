// src/providers/sinchInboundAdapter.js

exports.normalizeInboundFax = (payload) => {
  try {
    const {
      id,
      from,
      mediaUrl,
      region,
      direction,
      status
    } = payload;

    if (direction !== "inbound") {
      return { ok: false, error: "Not an inbound fax event" };
    }

    return {
      ok: true,
      providerFaxId: id,
      from,
      storageKey: mediaUrl,
      region,
      status,
      raw: payload
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message
    };
  }
};
