// src/providers/telnyxAdapter.js

const axios = require("axios");
const FaxNovaError = require("../errors/FaxNovaError");

async function sendFax({ faxId, to, from, documentUrl }) {
  try {
    const response = await axios.post(
      process.env.TELNYX_FAX_ENDPOINT,
      {
        faxId,
        to,
        from,
        documentUrl
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TELNYX_API_KEY}`
        }
      }
    );

    return {
      messageId: response.data.data.id,
      raw: response.data
    };

  } catch (err) {
    throw new FaxNovaError("Telnyx sendFax failed", {
      code: "TELNYX_SEND_FAILED",
      provider: "telnyx",
      details: err.message
    });
  }
}

async function handleInboundFax(payload) {
  return {
    provider: "telnyx",
    payload
  };
}

module.exports = {
  sendFax,
  handleInboundFax
};
