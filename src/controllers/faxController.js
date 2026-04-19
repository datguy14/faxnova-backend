const axios = require('axios');

exports.sendFax = async (req, res, next) => {
  try {
    const { to, fileUrl } = req.body;

    const faxUrl = `https://fax.api.sinch.com/v3/projects/${process.env.SINCH_PROJECT_ID}/faxes`;

    const payload = {
      from: process.env.SINCH_FAX_NUMBER,
      to,
      contentUrl: fileUrl
    };

    const response = await axios.post(faxUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': req.correlationId,
        'Authorization': `Basic ${Buffer.from(
          `${process.env.SINCH_KEY_ID}:${process.env.SINCH_KEY_SECRET}`
        ).toString('base64')}`
      }
    });

    res.json({
      success: true,
      faxId: response.data.id || 'unknown',
      status: response.data.status || 'submitted',
      correlationId: req.correlationId
    });

  } catch (error) {
    next({
      status: error.response?.status || 500,
      message: 'Fax send failed',
      details: error.response?.data || error.message
    });
  }
};
