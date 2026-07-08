// src/middleware/rateLimit.js
// Basic Strict‑Mode Rate Limiter

const rateLimit = require("express-rate-limit");

module.exports = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    ok: false,
    error: "Too many requests — slow down"
  },
  standardHeaders: true,
  legacyHeaders: false
});
