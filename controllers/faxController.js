const client = require('../utils/twilioClient');

exports.sendFax = async (req, res) => {
  try {
    const { to, fileUrl } = req.body;

    if (!to || !fileUrl) {
      return res.status(400).json({ error: "Missing 'to' or 'fileUrl'" });
    }

    const fax = await client.fax.faxes.create({
      from: process.env.TWILIO_FAX_NUMBER,
      to,
      mediaUrl: fileUrl
    });

    res.json({ success: true, faxSid: fax.sid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fax failed", details: error.message });
  }
};
