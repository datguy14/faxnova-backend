// src/audit/auditService.js

const fs = require('fs');
const path = require('path');
const AuditLog = require('../models/AuditLog');

const LOG_DIR = path.join(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'audit.log');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

exports.logEvent = async function logEvent({
  tenantId = null,
  type = 'system',
  action,
  correlationId,
  ip,
  path: requestPath,
  method,
  tier = 'unknown',
  details = {}
}) {
  const entry = {
    timestamp: new Date().toISOString(),
    tenantId,
    type,
    action,
    correlationId,
    ip,
    path: requestPath,
    method,
    tier,
    details
  };

  // -----------------------------
  // 1. Write to file (existing behavior)
  // -----------------------------
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
  } catch (err) {
    console.error('File audit log write failed:', err.message);
  }

  // -----------------------------
  // 2. Write to MongoDB (new behavior)
  // -----------------------------
  try {
    await AuditLog.create({
      tenantId,
      type,
      action,
      correlationId,
      ip,
      path: requestPath,
      method,
      tier,
      details
    });
  } catch (err) {
    console.error('MongoDB audit log write failed:', err.message);
  }
};
