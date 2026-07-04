// src/middleware/errorHandler.js

module.exports = (err, req, res, next) => {
  const correlationId = req.correlationId || "unknown";

  console.error(
    JSON.stringify({
      correlationId,
      error: err.message,
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
      timestamp: new Date().toISOString()
    })
  );

  return res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
    correlationId
  });
};
