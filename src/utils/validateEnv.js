// src/utils/validateEnv.js

module.exports = function validateEnv() {
  const required = [
    "MONGO_URI",
    "JWT_SECRET",
    "REDIS_HOST",
    "REDIS_PORT",
    "TELNYX_API_KEY",
    "SINCH_API_KEY"
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`- ${key}`));
    process.exit(1);
  }
};
