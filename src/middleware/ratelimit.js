// src/middleware/rateLimit.js

const rateLimit = require('express-rate-limit');

// Global limiter (default)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please try again later."
  }
});

// Strict limiter for sensitive or expensive routes
const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Rate limit exceeded for this endpoint."
  }
});

// Light limiter for status checks
const statusLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many status checks. Slow down."
  }
});

module.exports = {
  globalLimiter,
  strictLimiter,
  statusLimiter
};
