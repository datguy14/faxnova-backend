const phaxio = require('../utils/twilioClient');

exports.sendFax = async (req, res) => {
  try {
    const { to, fileUrl } = req.body;

    if (!to || !fileUrl) {
      return res.status(400).json({ error: "Missing 'to' or 'fileUrl'" });
    }

    const fax = await phaxio.faxes.create({
      to,
      file_url: fileUrl
    });

    res.json({ success: true, faxId: fax.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Fax failed", details: error.message });
  }
};
