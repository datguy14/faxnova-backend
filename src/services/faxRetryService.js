// src/services/faxRetryService.js

const axios = require('axios');

exports.retryFax = async (providerFaxId, correlationId) => {
  const url = `https://fax.api.sinch.com/v3/projects/${process.env.SINCH_PROJECT_ID}/faxes/${providerFaxId}/retry`;

  const response = await axios.post(
    url,
    {},
    {
      auth: {
        username: process.env.SINCH_KEY_ID,
        password: process.env.SINCH_KEY_SECRET
      },
      headers: {
        'X-Correlation-ID': correlationId
      }
    }
  );

  return response.data;
};
