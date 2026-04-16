const axios = require('axios');

exports.getFaxStatus = async (faxId) => {
  const url = `https://fax.api.sinch.com/v3/projects/${process.env.SINCH_PROJECT_ID}/faxes/${faxId}`;

  const response = await axios.get(url, {
    auth: {
      username: process.env.SINCH_KEY_ID,
      password: process.env.SINCH_KEY_SECRET
    },
    timeout: 10000
  });

  return response.data;
};
