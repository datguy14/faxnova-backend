// src/services/idempotencyGuard.js

const redis = require("../lib/redis"); // your redis client

module.exports = {
  async check(eventId) {
    // SETNX returns 1 if key was set, 0 if it already exists
    const key = `webhook:${eventId}`;
    const inserted = await redis.setNX(key, "1");

    if (inserted === 1) {
      // expire after 24 hours
      await redis.expire(key, 86400);
      return true; // first time seeing this event
    }

    return false; // duplicate
  },
};
