// src/providers/providerApiService.js — Unified Fax Architecture (CommonJS Only)

const telnyxProvider = require("./telnyxProvider");
const sinchProvider = require("./sinchProvider");

module.exports = {
  async sendFax({ provider, to, buffer, storageKey, faxId, region }) {
    try {
      let result;

      switch (provider) {
        case "telnyx":
          result = await telnyxProvider.sendFax({
            to,
            buffer,
            storageKey,
            faxId,
            region
          });
          break;

        case "sinch":
          result = await sinchProvider.sendFax({
            to,
            buffer,
            storageKey,
            faxId,
            region
          });
          break;

        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      return {
        ok: true,
        provider,
        providerFaxId: result.providerFaxId,
        raw: result.raw
      };
    } catch (err) {
      return {
        ok: false,
        provider,
        error: err.message,
        raw: err.raw || null
      };
    }
  }
};
