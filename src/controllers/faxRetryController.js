// src/controllers/faxRetryController.js
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
      correlationId: error.correlationId || req.correlationId
    });
  }
};
