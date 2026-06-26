// src/providers/sinchInboundAdapter.js

module.exports = {
  /**
   * Normalize Sinch inbound webhook payload
   */
  normalize(payload) {
    return {
      faxId: payload?.id,
      from: payload?.from,
      to: payload?.to,
      pages: payload?.pages || 1,
      mediaUrl: payload?.mediaUrl
    };
  }
};
