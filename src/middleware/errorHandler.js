const normalizeError = require('../utils/normalizeError');

module.exports = (err, req, res, next) => {
  const normalized = normalizeError(err);

  res.status(normalized.status).json({
    message: normalized.message,
    type: normalized.type,
    status: normalized.status,
    details: normalized.details,
    correlationId: req.correlationId
  });
};
