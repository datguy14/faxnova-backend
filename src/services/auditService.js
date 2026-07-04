// src/services/auditService.js

const FaxEvent = require("../models/FaxEvent");

exports.logEvent = async ({ tenantId, faxId, type, action, details = {} }) => {
  try {
    await FaxEvent.create({
      tenantId,
      faxId,
      type,
      action,
      details,
      createdAt: new Date()
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
