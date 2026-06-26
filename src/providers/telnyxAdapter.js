// src/providers/telnyxAdapter.js

const axios = require("axios");
const FaxNovaError = require("../errors/FaxNovaError");

module.exports = {
  /**
   * Send fax via Telnyx
   */
  async sendFax({ to, from, pages, documentUrl }) {
    try {
      const response = await axios.post(
        "https://api.telnyx.com/v2/faxes",
        {
          connection_id: process.env.TELNYX_CONNECTION_ID,
          to,
          from,
          media_url: documentUrl
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.TELNYX_API_KEY}`
          }
        }
      );

      return {
        jobId: response.data?.data?.id
      };
    } catch (err) {
      throw new FaxNovaError("Telnyx provider error", {
        code: "TELNYX_PROVIDER_ERROR",
        details: err.response?.data || err.message
      });
    }
  }
};
