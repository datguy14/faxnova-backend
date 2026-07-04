// src/services/faxService.js — STRICT-MODE FINAL

const inboundFaxService = require("./inboundFaxService");
const outboundFaxService = require("./outboundFaxService");
const faxStorageService = require("./faxStorageService");
const faxQueueService = require("./faxQueueService");

module.exports = {
  /**
   * Handle inbound fax (from provider → FaxNova)
   */
  async handleInboundFax(payload) {
    // Normalize inbound fax
    const normalized = await inboundFaxService.normalizeInbound(payload);

    // Store metadata + media
    const stored = await faxStorageService.storeInbound(normalized);

    // Queue for processing
    await faxQueueService.enqueueInbound(stored);

    return stored;
  },

  /**
   * Handle outbound fax (FaxNova → provider)
   */
  async sendOutboundFax(payload) {
    // Normalize outbound fax
    const normalized = await outboundFaxService.normalizeOutbound(payload);

    // Store metadata + media
    const stored = await faxStorageService.storeOutbound(normalized);

    // Queue for provider delivery
    await faxQueueService.enqueueOutbound(stored);

    return stored;
  },

  /**
   * Retrieve fax metadata (from storage layer)
   */
  async getFax(id) {
    return faxStorageService.getFax(id);
  },

  /**
   * Delete fax (metadata + media)
   */
  async deleteFax(id) {
    return faxStorageService.deleteFax(id);
  }
};
