// src/middleware/errorHandler.js

const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../utils/auditLogger");

// Detect Zod errors without importing Zod directly
const isZodError = (err) =>
  err?.issues && Array.isArray(err.issues) && err.name === "ZodError";

module.exports = (err, req, res, next) => {
  try {
    // ---------------------------------------
    // 1. Zod Validation Error
    // ---------------------------------------
    if (isZodError(err)) {
      const formatted = err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message
      }));

      audit.error("validation_error", {
        path: req.path,
        issues: formatted
      });

      return res.status(400).json({
        error: "Validation failed",
        issues: formatted
      });
    }

    // ---------------------------------------
    // 2. FaxNovaError (first‑class application error)
    // ---------------------------------------
    if (err instanceof FaxNovaError) {
      audit.error("faxnova_error", {
        path: req.path,
        code: err.code,
        details: err.details
      });

      return res.status(err.status || 400).json({
        error: err.message,
        code: err.code,
        details: err.details || null
      });
    }

    // ---------------------------------------
    // 3. Axios Provider Error
    // ---------------------------------------
    if (err?.response?.data) {
      audit.error("provider_http_error", {
        path: req.path,
        providerResponse: err.response.data
      });

      return res.status(502).json({
        error: "Provider error",
        providerResponse: err.response.data
      });
    }

    // ---------------------------------------
    // 4. Unexpected Error
    // ---------------------------------------
    audit.error("unexpected_error", {
      path: req.path,
      message: err.message,
      stack: err.stack
    });

    return res.status(500).json({
      error: "Internal server error",
      message: err.message
    });
  } catch (fatal) {
    // ---------------------------------------
    // 5. Fatal Error in Error Handler
    // ---------------------------------------
    console.error("FATAL ERROR HANDLER FAILURE:", fatal);

    return res.status(500).json({
      error: "Critical error",
      message: "The error handler failed"
    });
  }
};
