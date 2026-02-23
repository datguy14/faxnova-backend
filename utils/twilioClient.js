const axios = require('axios');

const SINCH_PROJECT_ID = process.env.SINCH_PROJECT_ID;
const SINCH_KEY_ID = process.env.SINCH_KEY_ID;
const SINCH_KEY_SECRET = process.env.SINCH_KEY_SECRET;

async function getAccessToken() {
  const tokenUrl = `https://auth.sinch.com/oauth2/token`;

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');

  const authHeader = Buffer.from(`${SINCH_KEY_ID}:${SINCH_KEY_SECRET}`).toString('base64');

  const response = await axios.post(tokenUrl, params, {
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return response.data.access_token;
}

module.exports = { getAccessToken, SINCH_PROJECT_ID };
