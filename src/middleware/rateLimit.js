// src/middleware/rateLimit.js

let memoryStore = new Map(); // fallback if Redis is not configured
let redisClient = null;

if (process.env.REDIS_URL) {
  const { createClient } = require("redis");
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.connect().catch(() => {
    redisClient = null; // fallback to memory store
  });
}

// Default: 60 requests per minute per key
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 60;

module.exports = async (req, res, next) => {
  try {
    const identifier =
      req.apiKey?.key || req.user?._id || req.ip || "anonymous";

    const key = `rate:${identifier}`;

    // Redis mode
    if (redisClient) {
      const current = await redisClient.incr(key);

      if (current === 1) {
        await redisClient.expire(key, WINDOW_MS / 1000);
      }

      if (current > MAX_REQUESTS) {
        return res.status(429).json({
          success: false,
          error: "Rate limit exceeded"
        });
      }

      return next();
    }

    // Memory fallback
    const now = Date.now();
    const entry = memoryStore.get(key) || { count: 0, reset: now + WINDOW_MS };

    if (now > entry.reset) {
      entry.count = 0;
      entry.reset = now + WINDOW_MS;
    }

    entry.count += 1;

    memoryStore.set(key, entry);

    if (entry.count > MAX_REQUESTS) {
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded"
      });
    }

    next();
  } catch (err) {
    // Fail-open for safety
    next();
  }
};
