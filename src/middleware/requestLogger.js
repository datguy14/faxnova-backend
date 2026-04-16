module.exports = (req, res, next) => {
  const start = Date.now();
  const correlationId = req.correlationId;

  res.on('finish', () => {
    const duration = Date.now() - start;

    console.log(
      JSON.stringify({
        level: 'info',
        message: 'HTTP Request',
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: duration,
        correlationId
      })
    );
  });

  next();
};
