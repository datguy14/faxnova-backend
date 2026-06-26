// src/providers/telnyxInboundAdapter.js

module.exports = {
  /**
   * Normalize Telnyx inbound webhook payload
   */
  normalize(payload) {
    const data = payload?.data?.payload || {};

    return {
      faxId: data?.fax_id,
      from: data?.from,
      to: data?.to,
      pages: data?.pages || 1,
      mediaUrl: data?.media_url
    };
  }
};
