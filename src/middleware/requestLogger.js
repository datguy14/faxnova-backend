// src/middleware/requestLogger.js

/**
 * Structured JSON request logger.
 * - Includes correlationId
 * - Measures duration
 * - Logs method, path, status, tier
 */

module.exports = function requestLogger(req, res, next) {
  const start = Date.now();
  const correlationId = req.correlationId;

  res.on('finish', () => {
    const durationMs = Date.now() - start;

    const logEntry = {
      level: "info",
      message: "HTTP Request",
      correlationId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      tier: req.apiTier || "unknown"
    };

    console.log(JSON.stringify(logEntry));
  });

  next();
};
