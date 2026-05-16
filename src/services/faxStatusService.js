// src/services/faxStatusService.js
const axios = require('axios');

exports.checkFaxStatus = async (faxId, correlationId) => {
  try {
    const response = await axios.get(
      `https://fax.api.sinch.com/xms/v1/${process.env.SINCH_PROJECT_ID}/batches/${faxId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.SINCH_KEY_SECRET,
          'X-API-User': process.env.SINCH_KEY_ID,
          'X-Correlation-ID': correlationId
        }
      }
    );

    return response.data;

  } catch (error) {
    throw {
      status: error.response?.status || 500,
      message: error.response?.data?.message || 'Failed to fetch fax status',
      details: error.response?.data || null
    };
  }
};
