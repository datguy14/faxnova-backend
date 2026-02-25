const axios = require('axios');

exports.sendFax = async (req, res) => {
  try {
    const { to, contentUrl } = req.body;

    if (!to || !contentUrl) {
      return res.status(400).json({ error: "Missing 'to' or 'contentUrl'" });
    }

    const response = await axios.post(
      `https://fax.api.sinch.com/v3/projects/${process.env.SINCH_PROJECT_ID}/faxes`,
      {
        to,
        contentUrl
      },
      {
        auth: {
          username: process.env.SINCH_KEY_ID,
          password: process.env.SINCH_KEY_SECRET
        }
      }
    );

    res.json({
      status: response.data.status,
      faxId: response.data.id
    });

  } catch (error) {
    console.error("Fax error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Fax failed",
      details: error.response?.data || error.message
    });
  }
};
