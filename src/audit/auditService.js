// src/audit/auditService.js

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'audit.log');

// Ensure directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Writes a structured audit event to disk.
 */
function writeAuditEvent(event) {
  const entry = {
    timestamp: new Date().toISOString(),
    ...event
  };

  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
}

/**
 * Public API for logging audit events.
 */
module.exports = {
  log: (req, type, action, details = {}) => {
    writeAuditEvent({
      correlationId: req.correlationId,
      tier: req.apiTier || "unknown",
      type,
      action,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      details
    });
  },

  readLogs: () => {
    if (!fs.existsSync(LOG_FILE)) return [];
    const lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n');
    return lines.map(line => JSON.parse(line));
  }
};
