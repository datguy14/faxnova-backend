// src/providers/sinchAdapter.js

const axios = require("axios");

const SINCH_BASE_URL = "https://fax.api.sinch.com/v1";

exports.sendFax = async ({ to, storageKey, region }) => {
  try {
    const response = await axios.post(
      `${SINCH_BASE_URL}/outbound/faxes`,
      {
        to,
        mediaUrl: storageKey,
        region
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SINCH_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return {
      ok: true,
      providerFaxId: response.data.id,
      raw: response.data
    };
  } catch (err) {
    return {
      ok: false,
      error: err.response?.data?.message || err.message
    };
  }
};

exports.getFaxStatus = async (providerFaxId) => {
  try {
    const response = await axios.get(
      `${SINCH_BASE_URL}/outbound/faxes/${providerFaxId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SINCH_API_KEY}`
        }
      }
    );

    return {
      ok: true,
      status: response.data.status,
      raw: response.data
    };
  } catch (err) {
    return {
      ok: false,
      error: err.response?.data?.message || err.message
    };
  }
};
