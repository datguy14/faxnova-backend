// utils/auditLogger.js
// NOTE: File-based logging is not used — Render's filesystem is ephemeral.
// Events are emitted as structured JSON to stdout for ingestion by log aggregators
// (e.g. Render Logs, Datadog, Logtail). Plug in a DB/external service here as needed.

function logFaxEvent(event) {
  const entry = {
    ...event,
    timestamp: new Date().toISOString(),
    level: 'info',
    type: 'fax_event',
  };

  console.log(JSON.stringify(entry));
}

module.exports = {
  logFaxEvent,
};
