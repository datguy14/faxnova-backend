// src/controllers/auditController.js

const auditService = require('../audit/auditService');

module.exports = {
  getAuditLogs: (req, res) => {
    const logs = auditService.readLogs();
    res.json({ success: true, logs });
  }
};
