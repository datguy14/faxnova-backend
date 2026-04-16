const axios = require('axios');

exports.retryFax = async (faxId, correlationId) => {
  try {
    const url = `https://fax.api.sinch.com/v3/projects/${process.env.SINCH_PROJECT_ID}/faxes/${faxId}/retry`;

    const response = await axios.post(
      url,
      {},
      {
        auth: {
          username: process.env.SINCH_KEY_ID,
          password: process.env.SINCH_KEY_SECRET
        },
        timeout: 10000,
        headers: {
          'X-Correlation-ID': correlationId
        }
      }
    );

    return response.data;

  } catch (error) {
    throw {
      message: 'Failed to retry fax',
      status: error.response?.status || 500,
      details: error.response?.data || error.message,
      correlationId
    };
  }
};
