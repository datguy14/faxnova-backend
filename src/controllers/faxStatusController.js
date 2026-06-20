const audit = require('../audit/auditService');
const { checkFaxStatus: checkFaxStatusService } = require('../services/faxStatusService');

exports.checkFaxStatus = async (req, res, next) => {
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

    const result = await checkFaxStatusService(faxId, correlationId);

    await audit.logFaxEvent({
      tenantId: req.tenantId || 'system',
      userId: req.user?.id || null,
      faxId,
      eventType: 'STATUS_CHECKED',
      status: result.status,
      details: { providerResponse: result },
      correlationId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    return res.status(200).json({
      success: true,
      faxId,
      status: result.status,
      providerStatus: result,
      correlationId
    });

  } catch (error) {
    await audit.logFaxEvent({
      faxId: req.params.faxId,
      eventType: 'STATUS_CHECK_FAILED',
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
