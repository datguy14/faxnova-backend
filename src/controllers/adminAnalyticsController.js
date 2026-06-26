// src/controllers/adminAnalyticsController.js
const AuditLog = require("../models/AuditLog");

module.exports = {
  async list(req, res) {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  }
};
