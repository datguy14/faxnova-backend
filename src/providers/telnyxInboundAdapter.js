// src/providers/telnyxInboundAdapter.js

exports.normalizeInboundFax = (payload) => {
  try {
    const data = payload?.data;

    if (!data) {
      return { ok: false, error: "Invalid Telnyx payload" };
    }

    const {
      id,
      direction,
      from,
      media_url,
      region,
      status
    } = data;

    if (direction !== "inbound") {
      return { ok: false, error: "Not an inbound fax event" };
    }

    return {
      ok: true,
      providerFaxId: id,
      from,
      storageKey: media_url,
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
