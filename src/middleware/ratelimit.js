// src/middleware/rateLimit.js

const rateLimit = require('express-rate-limit');

// Global free-tier limit
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 40,             // 40 req/min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Rate limit exceeded for free tier. Please upgrade for higher limits."
  }
});

// Strict limiter for sending faxes
const sendFaxLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,              // 5 sends/min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Free-tier send limit reached. Upgrade for higher throughput."
  }
});

// Hourly limiter for sending faxes
const sendFaxHourlyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,                  // 20 sends/hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Hourly fax send limit reached for free tier."
  }
});

// Status checks (cheap)
const statusLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many status checks. Slow down."
  }
});

// Auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many auth attempts. Try again later."
  }
});

module.exports = {
  globalLimiter,
  sendFaxLimiter,
  sendFaxHourlyLimiter,
  statusLimiter,
  authLimiter
};
