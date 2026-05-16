// src/services/sendFaxService.js
const axios = require('axios');

exports.sendFax = async (payload, correlationId) => {
  try {
    const response = await axios.post(
      `https://fax.api.sinch.com/xms/v1/${process.env.SINCH_PROJECT_ID}/batches`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.SINCH_KEY_SECRET,
          'X-API-User': process.env.SINCH_KEY_ID,
          'X-Correlation-ID': correlationId
        }
      }
    );

    return {
      id: response.data.id,
      status: response.data.status
    };

  } catch (error) {
    throw {
      status: error.response?.status || 500,
      message: error.response?.data?.message || 'Failed to send fax',
      details: error.response?.data || null
    };
  }
};
