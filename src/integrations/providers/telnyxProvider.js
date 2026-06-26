// src/integrations/providers/telnyxProvider.js

const axios = require("axios");
const FaxNovaError = require("../../errors/FaxNovaError");

module.exports = {
  async sendFax(payload) {
    try {
      const response = await axios.post(
        "https://api.telnyx.com/v2/faxes",
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      return {
        provider: "telnyx",
        providerId: response.data.data.id,
        status: response.data.data.status
      };

    } catch (err) {
      throw new FaxNovaError("Telnyx provider failed", {
        provider: "telnyx",
        code: err.code || "TELNYX_ERROR",
        details: err.response?.data || err.message
      });
    }
  }
};
