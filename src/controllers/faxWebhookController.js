// src/controllers/faxWebhookController.js
const audit = require('../services/auditService');

exports.handleFaxWebhook = async (req, res, next) => {
  try {
    const data = req.body;

    if (!data || !data.faxId || !data.status) {
      return next({
        status: 400,
        message: "Invalid webhook payload",
        correlationId: req.correlationId
      });
    }

    const correlationId = req.correlationId;

    // 🔥 AUDIT: Webhook event received
    await audit.logFaxEvent({
      faxId: data.faxId,
      eventType: `WEBHOOK_${data.status.toUpperCase()}`,
      recipient: data.to,
      status: data.status,
      details: { providerEvent: data },
      correlationId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: ['DELIVERED'].includes(data.status)
    });

    res.status(200).json({
      received: true,
      correlationId
    });

  } catch (error) {
    next({
      status: 500,
      message: error.message,
      correlationId: req.correlationId
    });
  }
};
