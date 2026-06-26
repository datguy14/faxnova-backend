// src/middleware/errorHandler.js

const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../utils/auditLogger");

/**
 * Global Error Handler (Production‑grade)
 *
 * Handles:
 * - Zod validation errors
 * - FaxNovaError (custom structured errors)
 * - Axios provider errors
 * - Unexpected exceptions
 *
 * Always returns JSON.
 */

module.exports = function errorHandler(err, req, res, next) {
  try {
    // -----------------------------
    // 1. Zod Validation Error
    // -----------------------------
    if (err.name === "ZodError") {
      const formatted = err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message
      }));

      audit.error("validation_error", {
        user: req.user?.id,
        path: req.originalUrl,
        errors: formatted
      });

      return res.status(400).json({
        error: "Validation failed",
        details: formatted
      });
    }

    // -----------------------------
    // 2. FaxNovaError (Custom)
    // -----------------------------
    if (err instanceof FaxNovaError) {
      audit.error("faxnova_error", {
        user: req.user?.id,
        code: err.code,
        details: err.details,
        path: req.originalUrl
      });

      return res.status(err.status || 500).json({
        error: err.message,
        code: err.code,
        details: err.details || null
      });
    }

    // -----------------------------
    // 3. Axios Provider Errors
    // -----------------------------
    if (err.isAxiosError) {
      audit.error("provider_http_error", {
        provider: err.config?.provider,
        status: err.response?.status,
        message: err.message,
        url: err.config?.url
      });

      return res.status(502).json({
        error: "Provider communication failed",
        provider: err.config?.provider || "unknown",
        status: err.response?.status || null,
        details: err.response?.data || err.message
      });
    }

    // -----------------------------
    // 4. Unexpected Errors
    // -----------------------------
    audit.error("unhandled_exception", {
      message: err.message,
      stack: err.stack,
      path: req.originalUrl
    });

    return res.status(500).json({
      error: "Internal server error",
      message: err.message
    });
  } catch (fatal) {
    // Failsafe: never let the error handler crash
    console.error("FATAL ERROR IN ERROR HANDLER:", fatal);

    return res.status(500).json({
      error: "Critical error in error handler"
    });
  }
};
