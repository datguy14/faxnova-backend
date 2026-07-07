// src/lib/redis.js — Fully Updated, Production‑Ready (CommonJS Only)

const { Redis } = require("ioredis");

// Validate required env vars
const host = process.env.REDIS_HOST;
const port = process.env.REDIS_PORT;
const password = process.env.REDIS_PASSWORD || null;
const tlsEnabled = process.env.REDIS_TLS === "true";

if (!host || !port) {
  console.error("❌ Missing Redis configuration: REDIS_HOST or REDIS_PORT");
  process.exit(1); // Hard fail — prevents partial startup
}

// Build connection options
const redisOptions = {
  host,
  port: Number(port),

  // Prevent BullMQ from crashing on retry storms
  maxRetriesPerRequest: null,

  // Avoid ready-check delays in multi-region setups
  enableReadyCheck: false,

  // Optional password (Redis Cloud / Upstash / AWS Elasticache)
  password: password || undefined,

  // Optional TLS (Redis Cloud / Upstash)
  tls: tlsEnabled ? {} : undefined,

  // Production-safe timeouts
  connectTimeout: 8000,
  keepAlive: 1,
};

// Create Redis connection
const connection = new Redis(redisOptions);

// Event logging for monitoring + SLA enforcement
connection.on("connect", () => {
  console.log(`🔌 Redis connected at ${host}:${port}`);
});

connection.on("ready", () => {
  console.log("⚡ Redis ready (command queue active)");
});

connection.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

connection.on("end", () => {
  console.error("⚠️ Redis connection closed — workers may fail");
});

connection.on("reconnecting", () => {
  console.warn("♻️ Redis reconnecting...");
});

// Export connection for BullMQ queues + workers
module.exports = { connection };
