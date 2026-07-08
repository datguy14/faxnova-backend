// src/server.js — Strict‑Mode, Multi‑Provider Entrypoint (CommonJS)

require("dotenv").config();

const app = require("./app");

// Core infrastructure
const { connectMongo } = require("./lib/mongo");
const { connection: redis } = require("./lib/redis");

// Workers (must load AFTER Redis + Mongo)
const bootWorkers = () => {
  try {
    require("./workers/outboundFaxWorker");
    require("./workers/retryFaxWorker");
    require("./workers/webhookWorker");

    console.log("📡 Workers booted successfully");
  } catch (err) {
    console.error("❌ Worker boot failure:", err);
    process.exit(1);
  }
};

// Validate required environment variables
function validateEnv() {
  const required = [
    "MONGO_URI",
    "REDIS_HOST",
    "REDIS_PORT",
    "JWT_SECRET",
    "JWT_ADMIN_SECRET",
    "TELNYX_API_KEY",
    "TELNYX_WEBHOOK_SECRET",
    "SINCH_API_KEY",
    "SINCH_API_SECRET",
    "SINCH_PROJECT_ID",
    "WEBHOOK_SECRET"
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`   - ${key}`));
    process.exit(1);
  }
}

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    console.log("🔍 Validating environment...");
    validateEnv();

    console.log("🗄️ Connecting to MongoDB...");
    await connectMongo();

    console.log("🔌 Checking Redis connection...");
    await redis.ping();

    console.log("⚙️ Booting workers...");
    bootWorkers();

    app.listen(PORT, () => {
      console.log(`🚀 FaxNova backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Fatal startup error:", err);
    process.exit(1);
  }
})();
