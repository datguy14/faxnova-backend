// src/controllers/faxController.js

const outboundFaxService = require("../services/outboundFaxService");

exports.createFax = async (req, res) => {
  try {
    const { to, storageKey, residencyZone, tier, region } = req.body;

    const fax = await outboundFaxService.processOutboundFax({
      to,
      storageKey,
      residencyZone,
      tier,
      region
    });

    res.json(fax);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
