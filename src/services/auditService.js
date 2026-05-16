// src/services/auditService.js
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const LOG_DIR = path.join(__dirname, '../../logs');
const AUDIT_FILE = path.join(LOG_DIR, 'fax-audit.log');

async function ensureLogDir() {
  await fs.mkdir(LOG_DIR, { recursive: true });
}

exports.logFaxEvent = async (event) => {
  await ensureLogDir();
  
  const logEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    correlationId: event.correlationId || 'unknown',
    tenantId: event.tenantId || 'system',           // Important for multi-tenant
    userId: event.userId,
    faxId: event.faxId,
    eventType: event.eventType,                     // e.g. 'SEND_INITIATED', 'DELIVERED'
    recipient: event.recipient,                     // fax number (no PHI)
    pages: event.pages,
    status: event.status,
    details: event.details || {},                   // sanitized metadata
    ip: event.ip,
    userAgent: event.userAgent,
    success: event.success !== false
  };

  const logLine = JSON.stringify(logEntry) + '\n';
  
  // Append to file (atomic for most cases)
  await fs.appendFile(AUDIT_FILE, logLine);
  
  // Optional: Also console for dev + external service (Winston, DataDog, etc.)
  console.log('[AUDIT]', JSON.stringify(logEntry));
  
  return logEntry.id;
};
