// src/server.js — Fully Updated, Production‑Ready (CommonJS Only)

require("dotenv").config();

// Core app + DB
const app = require("./app");
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
    process.exit(1); // Hard fail — prevents partial startup
  }
};

// Validate required environment variables
function validateEnv() {
  const required = [
    "MONGO_URI",
    "REDIS_URL",
    "JWT_SECRET",
    "JWT_ADMIN_SECRET",
    "TELNYX_API_KEY",
    "SINCH_API_KEY",
    "SINCH_API_SECRET",
    "SINCH_PROJECT_ID",
    "WEBHOOK_SIGNATURE_SECRET"
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`   - ${key}`));
    process.exit(1);
  }
}

// Start server
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
