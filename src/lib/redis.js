// src/lib/redis.js

const connection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT)
};

if (!connection.host || !connection.port) {
  throw new Error("Missing Redis configuration");
}

module.exports = { connection };
