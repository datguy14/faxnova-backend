// src/lib/redis.js
const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

redis.on("connect", () => {
  console.log("Redis connected (ioredis, pooled)");
});

redis.on("error", (err) => {
  console.error("Redis connection error", err);
});

module.exports = redis;
