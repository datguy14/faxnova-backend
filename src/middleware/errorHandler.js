module.exports = (err, req, res, next) => {
  const status = err.status || 500;

  const response = {
    message: err.message || 'Internal Server Error',
    status,
    details: err.details || null,
    correlationId: err.correlationId || req.correlationId
  };

  // Structured logging for observability
  console.error(
    JSON.stringify({
      level: 'error',
      status,
      message: response.message,
      details: response.details,
      correlationId: response.correlationId,
      path: req.originalUrl,
      method: req.method
    })
  );

  res.status(status).json(response);
};
