// src/utils/auditLogger.js

/**
 * Production‑grade audit logger for FaxNova.
 *
 * Requirements:
 * - No file writes (Render ephemeral FS)
 * - JSON‑structured logs
 * - Multi‑tenant metadata support
 * - Provider + routing event support
 * - Works with log aggregators (Datadog, Logtail, Render Logs)
 */

module.exports = {
  /**
   * Emit a structured audit event.
   *
   * @param {string} action - Event name (e.g., "fax_sent", "provider_outage_triggered")
   * @param {object} meta - Additional metadata
   */
  log(action, meta = {}) {
    try {
      const event = {
        timestamp: new Date().toISOString(),
        action,
        level: "info",
        type: "audit_event",
        ...meta
      };

      // Emit to stdout for ingestion by log aggregators
      console.log(JSON.stringify(event));
    } catch (err) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          action: "audit_logger_failure",
          level: "error",
          type: "audit_event",
          details: err.message
        })
      );
    }
  },

  /**
   * Emit an error‑level audit event.
   */
  error(action, meta = {}) {
    try {
      const event = {
        timestamp: new Date().toISOString(),
        action,
        level: "error",
        type: "audit_event",
        ...meta
      };

      console.error(JSON.stringify(event));
    } catch (err) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          action: "audit_logger_failure",
          level: "error",
          type: "audit_event",
          details: err.message
        })
      );
    }
  }
};
