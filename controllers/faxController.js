const axios = require('axios');
const { getAccessToken, SINCH_PROJECT_ID, SINCH_FAX_NUMBER } = require('../utils/twilioClient');

exports.sendFax = async (req, res) => {
  try {
    const { to, fileUrl } = req.body;

    if (!to || !fileUrl) {
      return res.status(400).json({ error: "Missing 'to' or 'fileUrl'" });
    }

    // Get OAuth2 access token
    const accessToken = await getAccessToken();

    // Correct Sinch Fax API v3 endpoint
    const faxUrl = `https://fax.api.sinch.com/v3/projects/${SINCH_PROJECT_ID}/faxes`;

    // Build fax payload
    const payload = {
      from: SINCH_FAX_NUMBER,   // your Sinch fax number
      to: to,
      media: [
        {
          url: fileUrl
        }
      ]
    };

    // Send fax request
    const response = await axios.post(faxUrl, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Success response
    res.json({
      success: true,
      faxId: response.data.id || "unknown",
      status: response.data.status || "submitted"
    });

  } catch (error) {
    console.error("Fax error:", error.response?.data || error.message);

    res.status(500).json({
      error: "Fax failed",
      details: error.response?.data || error.message
    });
  }
};
