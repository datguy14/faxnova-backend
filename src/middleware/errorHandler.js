// src/middleware/errorHandler.js

/**
 * Centralized error handler.
 * - Normalizes all errors into a consistent JSON shape
 * - Includes correlationId
 * - Logs structured JSON
 * - Prevents leaking internal stack traces
 */

module.exports = function errorHandler(err, req, res, next) {
  const correlationId = req.correlationId;

  // Default normalized error
  const normalized = {
    message: "An unexpected error occurred.",
    status: 500,
    type: "InternalError",
    details: null
  };

  // If the error already has a status, use it
  if (err.status) normalized.status = err.status;

  // If the error already has a message, use it
  if (err.message) normalized.message = err.message;

  // If the error has a type, use it
  if (err.type) normalized.type = err.type;

  // Axios/Sinch error normalization
  if (err.response && err.response.data) {
    normalized.status = err.response.status || 500;
    normalized.type = "UpstreamServiceError";
    normalized.details = err.response.data;
  }

  // Log structured JSON
  console.error(
    JSON.stringify({
      level: "error",
      message: "Unhandled Error",
      correlationId,
      error: {
        message: normalized.message,
        type: normalized.type,
        status: normalized.status,
        details: normalized.details
      }
    })
  );

  // Send safe JSON response
  res.status(normalized.status).json({
    success: false,
    error: normalized.message,
    type: normalized.type,
    details: normalized.details,
    correlationId
  });
};
