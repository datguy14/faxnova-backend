// src/providers/sinchAdapter.js

const axios = require("axios");
const FaxNovaError = require("../errors/FaxNovaError");

async function sendFax({ faxId, to, from, documentUrl }) {
  try {
    const response = await axios.post(
      process.env.SINCH_FAX_ENDPOINT,
      {
        faxId,
        to,
        from,
        documentUrl
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SINCH_API_KEY}`
        }
      }
    );

    return {
      messageId: response.data.messageId,
      raw: response.data
    };

  } catch (err) {
    throw new FaxNovaError("Sinch sendFax failed", {
      code: "SINCH_SEND_FAILED",
      provider: "sinch",
      details: err.message
    });
  }
}

async function handleInboundFax(payload) {
  return {
    provider: "sinch",
    payload
  };
}

module.exports = {
  sendFax,
  handleInboundFax
};
