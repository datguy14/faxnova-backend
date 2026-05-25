// utils/validateEnv.js

const REQUIRED_ENV_VARS = [
  // Server
  "PORT",
  "NODE_ENV",

  // Logging & Security
  "LOG_LEVEL",
  "RATE_LIMIT_WINDOW_MS",
  "RATE_LIMIT_MAX",

  // Sinch
  "SINCH_API_KEY",
  "SINCH_API_SECRET",
  "SINCH_SERVICE_PLAN_ID",
  "SINCH_FAX_NUMBER",

  // Telnyx
  "TELNYX_API_KEY",
  "TELNYX_CONNECTION_ID",
  "TELNYX_FAX_NUMBER",

  // App
  "APP_URL",
  "JWT_SECRET",

  // Optional
  "ENABLE_PROVIDER_FAILOVER",
  "PRIMARY_PROVIDER"
];

function validateEnv() {
  const missing = [];

  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key] || process.env[key].trim() === "") {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error("\n❌ Missing required environment variables:\n");
    missing.forEach((key) => console.error(` - ${key}`));
    console.error(
      "\nFix your .env file or deployment environment before starting the server.\n"
    );
    process.exit(1);
  }

  console.log("✅ Environment variables validated successfully");
}

module.exports = validateEnv;
