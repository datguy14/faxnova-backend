// src/controllers/inboundFaxController.js

const inboundFaxService = require("../services/inboundFaxService");

exports.receiveInboundFax = async (req, res) => {
  try {
    const fax = await inboundFaxService.processInboundFax(req.body);
    res.json(fax);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
