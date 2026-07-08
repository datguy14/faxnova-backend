// src/middleware/globalErrorHandler.js — Unified Fax Architecture (CommonJS Only)

const auditService = require("../services/auditService");

module.exports = function globalErrorHandler(err, req, res, next) {
  console.error("GLOBAL ERROR:", err);

  auditService.logEvent({
    type: "GLOBAL_ERROR",
    details: {
      message: err.message,
      stack: err.stack,
      route: req.originalUrl
    }
  });

  res.status(500).json({
    ok: false,
    error: "Internal server error",
    message: err.message
  });
};
