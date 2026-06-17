// src/middleware/rateLimit.js
import rateLimit from "express-rate-limit";

/**
 * Fax sending limiter
 * Protects /fax/send and /fax/:id/retry
 * Prevents abuse, spam, and brute-force retries.
 */
export const faxLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 fax actions per minute per IP/user
  message: {
    error: "Too many fax requests. Please slow down."
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Provider analytics limiter
 * Protects /providers/* endpoints
 * These endpoints are read-heavy but should not be spammed.
 */
export const providerLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 50, // 50 provider queries per window
  message: {
    error: "Too many provider analytics requests."
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Webhook limiter (light)
 * Providers must be able to POST freely.
 * We only limit extreme abuse or malformed traffic.
 */
export const webhookLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 500, // Providers can send many events at once
  message: {
    error: "Webhook rate limit exceeded."
  },
  skipFailedRequests: false,
  standardHeaders: true,
  legacyHeaders: false
});
