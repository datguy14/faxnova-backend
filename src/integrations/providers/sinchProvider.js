// src/integrations/providers/sinchProvider.js

const axios = require("axios");
const FaxNovaError = require("../../errors/FaxNovaError");

module.exports = {
  async sendFax(payload) {
    try {
      const response = await axios.post(
        "https://api.sinch.com/fax/send",
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.SINCH_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      return {
        provider: "sinch",
        providerId: response.data.id,
        status: response.data.status
      };

    } catch (err) {
      throw new FaxNovaError("Sinch provider failed", {
        provider: "sinch",
        code: err.code || "SINCH_ERROR",
        details: err.response?.data || err.message
      });
    }
  }
};
