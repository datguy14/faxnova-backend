// src/controllers/analyticsController.js
const Fax = require("../models/Fax");

module.exports = {
  async summary(req, res) {
    const total = await Fax.countDocuments();
    const sent = await Fax.countDocuments({ status: "sent" });
    const failed = await Fax.countDocuments({ status: "failed" });

    res.json({ total, sent, failed });
  }
};
