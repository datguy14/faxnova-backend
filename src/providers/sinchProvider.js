// src/providers/sinchProvider.js — Unified Fax Architecture (CommonJS Only)

module.exports = {
  async sendFax({ to, buffer, storageKey, faxId, region }) {
    try {
      // TODO: Replace with real Sinch API call
      const providerFaxId = `sinch_${Date.now()}`;

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
