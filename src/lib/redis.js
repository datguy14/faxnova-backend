// src/lib/redis.js — Strict‑Mode Redis Connection

const { Redis } = require("ioredis");

const host = process.env.REDIS_HOST;
const port = process.env.REDIS_PORT;

if (!host || !port) {
  throw new Error("Missing Redis configuration: REDIS_HOST or REDIS_PORT");
}

const connection = new Redis({
  host,
  port: Number(port),
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

module.exports = { connection };
