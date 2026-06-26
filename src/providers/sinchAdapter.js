// src/providers/sinchAdapter.js

const axios = require("axios");
const FaxNovaError = require("../errors/FaxNovaError");

module.exports = {
  /**
   * Send fax via Sinch
   */
  async sendFax({ to, from, pages, documentUrl }) {
    try {
      const response = await axios.post(
        process.env.SINCH_FAX_URL,
        {
          to,
          from,
          pages,
          mediaUrl: documentUrl
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.SINCH_API_KEY}`
          }
        }
      );

      return {
        jobId: response.data?.id || response.data?.jobId
      };
    } catch (err) {
      throw new FaxNovaError("Sinch provider error", {
        code: "SINCH_PROVIDER_ERROR",
        details: err.response?.data || err.message
      });
    }
  }
};
