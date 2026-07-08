// src/services/inboundPdfService.js — Unified Fax Architecture (CommonJS Only)

const axios = require("axios");

module.exports = {
  async fetchPdfBuffer(pdfUrl) {
    try {
      const response = await axios.get(pdfUrl, {
        responseType: "arraybuffer"
      });

      return {
        ok: true,
        buffer: Buffer.from(response.data)
      };
    } catch (err) {
      return {
        ok: false,
        error: err.message
      };
    }
  }
};
