const normalizeError = require('../utils/normalizeError');

module.exports = (err, req, res, next) => {
  const normalized = normalizeError(err);

  res.status(normalized.status || 500).json({
    error: true,
    code: normalized.status || 500,
    message: normalized.message || 'Unexpected error',
    type: normalized.type || 'UnknownError',
    details: normalized.details || null,
    payload: normalized.payload || req.body || null,
    correlationId: normalized.correlationId || req.correlationId || null,
    timestamp: normalized.timestamp || new Date().toISOString()
  });
};
