// src/providers/providerApiService.js — Unified Fax Architecture (CommonJS Only)

module.exports = {
  async sendFax({ provider, to, storageKey, buffer, faxId, region }) {
    // TODO: implement real provider calls
    // For now, simulate providerFaxId
    const providerFaxId = `${provider}-${Date.now()}`;

    return {
      providerFaxId
    };
  }
};
