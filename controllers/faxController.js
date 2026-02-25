const axios = require('axios');

exports.sendFax = async (req, res) => {
  try {
    const { to, fileUrl } = req.body;

    if (!to || !fileUrl) {
      return res.status(400).json({ error: "Missing 'to' or 'fileUrl'" });
    }

    const faxUrl = `https://fax.api.sinch.com/v3/projects/${process.env.SINCH_PROJECT_ID}/faxes`;

    const payload = {
      from: process.env.SINCH_FAX_NUMBER,
      to,
      media: [
        {
          url: fileUrl
        }
      ]
    };

    const response = await axios.post(faxUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Timestamp': new Date().toISOString(),
        'Authorization': `Basic ${Buffer.from(
          `${process.env.SINCH_KEY_ID}:${process.env.SINCH_KEY_SECRET}`
        ).toString('base64')}`
      }
    });

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
