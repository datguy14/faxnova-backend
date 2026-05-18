// src/controllers/webhookController.js

const auditService = require('../audit/auditService');

/**
 * Handles inbound fax webhooks from Sinch.
 * Normalizes the payload, logs an audit event, and returns 200 immediately.
 */
module.exports = {
  handleFaxWebhook: async (req, res) => {
    try {
      const event = req.body;

      // Basic validation
      if (!event || !event.id || !event.status) {
        auditService.log(req, "webhook", "invalid_payload", { body: req.body });
        return res.status(400).json({
          success: false,
          error: "Invalid webhook payload."
        });
      }

      // Normalize event
      const normalized = {
        faxId: event.id,
        status: event.status,
        pages: event.pages || null,
        from: event.from || null,
        to: event.to || null,
        timestamp: event.timestamp || new Date().toISOString()
      };

      // Audit log
      auditService.log(req, "webhook", "fax_status_update", normalized);

      // TODO: Persist to DB (future upgrade)
      // TODO: Trigger notifications (future upgrade)

      // Sinch requires fast 200 response
      return res.status(200).json({ success: true });
    } catch (err) {
      auditService.log(req, "webhook", "handler_error", { error: err.message });
      return res.status(500).json({
        success: false,
        error: "Webhook handler failed."
      });
    }
  }
};
