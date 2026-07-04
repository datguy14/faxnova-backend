// src/services/providerApiService.js

const axios = require("axios");

exports.sendFax = async ({ to, storageKey, region }) => {
  try {
    // Provider endpoint selection (simple, stable)
    const endpoint = process.env.PROVIDER_API_URL;

    const response = await axios.post(`${endpoint}/send`, {
      to,
      storageKey,
      region
    });

    return {
      provider: response.data.provider || "default",
      messageId: response.data.messageId
    };
  } catch (err) {
    throw new Error(`Provider API error: ${err.message}`);
  }
};

exports.getStatus = async (providerMessageId) => {
  try {
    const endpoint = process.env.PROVIDER_API_URL;

    const response = await axios.get(
      `${endpoint}/status/${providerMessageId}`
    );

    return {
      status: response.data.status,
      provider: response.data.provider || "default"
    };
  } catch (err) {
    throw new Error(`Provider API error: ${err.message}`);
  }
};
