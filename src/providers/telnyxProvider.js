// src/providers/telnyxProvider.js — Unified Fax Architecture (CommonJS Only)

module.exports = {
  async sendFax({ to, buffer, storageKey, faxId, region }) {
    try {
      // TODO: Replace with real Telnyx API call
      const providerFaxId = `telnyx_${Date.now()}`;

      return {
        providerFaxId,
        raw: {
          to,
          storageKey,
          faxId,
          region,
          simulated: true
        }
      };
    } catch (err) {
      err.raw = { to, storageKey, faxId, region };
      throw err;
    }
  }
};
