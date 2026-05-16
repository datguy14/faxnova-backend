// src/controllers/faxRetryController.js
const { retryFax } = require('../services/faxRetryService');
const audit = require('../services/auditService');

exports.retryFaxController = async (req, res, next) => {
  try {
    const { faxId } = req.params;
    const correlationId = req.correlationId;

    if (!faxId) {
      return next({
        status: 400,
        message: 'faxId is required',
        correlationId
      });
    }

    // 🔥 AUDIT: Retry requested
    await audit.logFaxEvent({
      tenantId: req.tenantId || 'system',
      userId: req.user?.id || null,
      faxId,
      eventType: 'RETRY_REQUESTED',
      status: 'PENDING_RETRY',
      correlationId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    // Perform retry
    const result = await retryFax(faxId, correlationId);

    // 🔥 AUDIT: Retry succeeded
    await audit.logFaxEvent({
      tenantId: req.tenantId || 'system',
      userId: req.user?.id || null,
      faxId: result.id,
      eventType: 'RETRY_SUCCESS',
      status: result.status,
      correlationId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    return res.status(200).json({
      success: true,
      faxId: result.id,
      status: result.status,
      correlationId
    });

  } catch (error) {
    // 🔥 AUDIT: Retry failed
    await audit.logFaxEvent({
      faxId: req.params.faxId,
      eventType: 'RETRY_FAILED',
      status: 'ERROR',
      details: { error: error.message },
      correlationId: req.correlationId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: false
    });

    next({
      status: error.status || 500,
      message: error.message,
      details: error.details || null,
      correlationId: req.correlationId
    });
  }
};
