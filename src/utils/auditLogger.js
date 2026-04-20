// utils/auditLogger.js
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'fax-events.log');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

function logFaxEvent(event) {
  const entry = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  const line = JSON.stringify(entry) + '\n';

  fs.appendFile(LOG_FILE, line, (err) => {
    if (err) {
      console.error('Failed to write fax event log:', err);
    }
  });
}

module.exports = {
  logFaxEvent,
};
