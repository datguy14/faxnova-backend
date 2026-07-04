// src/middleware/requestLogger.js

module.exports = (req, res, next) => {
  const start = Date.now();

  const correlationId =
    req.headers["x-correlation-id"] ||
    req.correlationId ||
    `cid_${Math.random().toString(36).slice(2)}`;

  req.correlationId = correlationId;

  const identity =
    req.apiKey?.key ||
    req.user?._id ||
    req.ip ||
    "anonymous";

  res.on("finish", () => {
    const duration = Date.now() - start;

    console.log(
      JSON.stringify({
        correlationId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: duration,
        identity,
        timestamp: new Date().toISOString()
      })
    );
  });

  next();
};
