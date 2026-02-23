const axios = require('axios');
const { getAccessToken, SINCH_PROJECT_ID } = require('../utils/twilioClient');

exports.sendFax = async (req, res) => {
  try {
    const { to, fileUrl } = req.body;

    if (!to || !fileUrl) {
      return res.status(400).json({ error: "Missing 'to' or 'fileUrl'" });
    }

    const accessToken = await getAccessToken();

    const faxUrl = `https://fax.api.sinch.com/v1/projects/${SINCH_PROJECT_ID}/faxes`;

    const response = await axios.post(
      faxUrl,
      {
        to,
        fileUrl
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      faxId: response.data.id
    });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({
      error: "Fax failed",
      details: error.response?.data || error.message
    });
  }
};
