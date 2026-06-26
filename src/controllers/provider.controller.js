// src/controllers/providerController.js
const OutboundFax = require("../models/OutboundFax");

module.exports = {
  async list(req, res) {
    const faxes = await OutboundFax.find().sort({ createdAt: -1 }).limit(50);
    res.json(faxes);
  }
};
