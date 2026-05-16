// src/controllers/faxController.js
const { sendFax } = require('../services/sendFaxService');
const audit = require('../services/auditService');

exports.sendFax = async (req, res, next) => {
  try {
    if (!req.body.to || !req.body.fileUrl) {
      return next({
        status: 400,
        message: "Missing required fields: 'to' and 'fileUrl'",
        correlationId: req.correlationId
      });
    }

    const payload = {
      from: process.env.SINCH_FAX_NUMBER,
      to: Array.isArray(req.body.to) ? req.body.to : [req.body.to],
      media: [{ url: req.body.fileUrl }]
    };

    const correlationId = req.correlationId;

    // Send fax via provider
    const result = await sendFax(payload, correlationId);

    // 🔥 AUDIT: Fax send initiated
    await audit.logFaxEvent({
      tenantId: req.tenantId || 'system',
      userId: req.user?.id || null,
      faxId: result.id,
      eventType: 'SEND_INITIATED',
      recipient: req.body.to,
      pages: req.body.pages || 'unknown',
      status: 'QUEUED',
      correlationId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    res.status(201).json({
      success: true,
      faxId: result.id,
      status: result.status,
      correlationId
    });

  } catch (error) {
    next({
      status: error.status || 500,
      message: error.message,
      details: error.details || null,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    });
  }
};
