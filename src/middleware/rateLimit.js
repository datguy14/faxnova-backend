// src/middleware/rateLimit.js

const rateLimit = require("express-rate-limit");

/**
 * FaxNova v1 Rate Limiters
 *
 * - faxLimiter: protects fax send + retry endpoints
 * - providerLimiter: protects provider analytics endpoints
 * - analyticsLimiter: protects admin analytics endpoints
 *
 * All limiters:
 * - Use standard headers
 * - Disable legacy headers
 * - Return JSON error responses
 */

const faxLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 fax actions per minute per IP
  message: {
    error: "Too many fax requests. Please slow down."
  },
  standardHeaders: true,
  legacyHeaders: false
});

const providerLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 50, // provider analytics queries
  message: {
    error: "Too many provider analytics requests."
  },
  standardHeaders: true,
  legacyHeaders: false
});

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // admin analytics queries
  message: {
    error: "Too many analytics requests."
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  faxLimiter,
  providerLimiter,
  analyticsLimiter
};
