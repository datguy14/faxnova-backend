// src/providers/telnyxAdapter.js

const axios = require("axios");

const TELNYX_BASE_URL = "https://api.telnyx.com/v2";

exports.sendFax = async ({ to, storageKey, region }) => {
  try {
    const response = await axios.post(
      `${TELNYX_BASE_URL}/faxes`,
      {
        to,
        media_url: storageKey,
        region
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return {
      ok: true,
      providerFaxId: response.data.data.id,
      raw: response.data
    };
  } catch (err) {
    return {
      ok: false,
      error: err.response?.data?.errors?.[0]?.detail || err.message
    };
  }
};

exports.getFaxStatus = async (providerFaxId) => {
  try {
    const response = await axios.get(
      `${TELNYX_BASE_URL}/faxes/${providerFaxId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TELNYX_API_KEY}`
        }
      }
    );

    return {
      ok: true,
      status: response.data.data.status,
      raw: response.data
    };
  } catch (err) {
    return {
      ok: false,
      error: err.response?.data?.errors?.[0]?.detail || err.message
    };
  }
};
