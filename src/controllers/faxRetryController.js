const { retryFax } = require('../services/faxRetryService');

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

    const result = await retryFax(faxId, correlationId);

    return res.status(200).json({
      message: 'Fax retry initiated successfully',
      data: result,
      correlationId
    });

  } catch (error) {
    next({
      status: error.status || 500,
      message: 'Failed to retry fax',
      details: error.details || error.message,
      correlationId: error.correlationId || req.correlationId
    });
  }
};
