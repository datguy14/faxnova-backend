const axios = require('axios');

exports.retryFax = async (faxId) => {
  const url = `https://fax.api.sinch.com/v3/projects/${process.env.SINCH_PROJECT_ID}/faxes/${faxId}/retry`;

  const response = await axios.post(
    url,
    {},
    {
      auth: {
        username: process.env.SINCH_KEY_ID,
        password: process.env.SINCH_KEY_SECRET
      }
    }
  );

  return response.data;
};
