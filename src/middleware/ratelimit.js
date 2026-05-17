// src/middleware/rateLimit.js

const rateLimit = require('express-rate-limit');

// Global rate limiter (adjust as needed)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,                 // 60 requests per minute per IP
  standardHeaders: true,   // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,    // Disable X-RateLimit-* headers
  message: {
    success: false,
    error: "Too many requests. Please try again later."
  }
});

module.exports = limiter;
