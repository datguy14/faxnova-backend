// src/guards/idempotencyGuard.js

let cache = new Map(); // fallback if Redis is not configured
let redisClient = null;

if (process.env.REDIS_URL) {
  const { createClient } = require("redis");
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.connect().catch(() => {
    redisClient = null; // fallback to memory cache
  });
}

const TTL_SECONDS = 60 * 5; // 5 minutes

exports.check = async ({ tenantId, key }) => {
  try {
    const compositeKey = `${tenantId}:${key}`;

    // Redis mode
    if (redisClient) {
      const exists = await redisClient.get(compositeKey);
      if (exists) {
        return { ok: false };
      }

      await redisClient.set(compositeKey, "1", { EX: TTL_SECONDS });
      return { ok: true };
    }

    // Memory fallback
    if (cache.has(compositeKey)) {
      return { ok: false };
    }

    cache.set(compositeKey, Date.now());

    // Auto-expire memory entries
    setTimeout(() => cache.delete(compositeKey), TTL_SECONDS * 1000);

    return { ok: true };
  } catch (err) {
    return { ok: true, warning: err.message }; // fail-open for safety
  }
};
