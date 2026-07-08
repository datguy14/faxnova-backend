// src/middleware/errorHandler.js
// Global Strict‑Mode Error Handler

module.exports = (err, req, res, next) => {
  console.error("❌ Global Error:", err);

  res.status(err.status || 500).json({
    ok: false,
    error: err.message || "Internal server error"
  });
};
