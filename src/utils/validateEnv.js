// src/utils/validateEnv.js

const REQUIRED_ENV = [
  // Core server
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',

  // Auth
  'JWT_SECRET',

  // AI / Agents
  'OPENAI_API_KEY',

  // Provider: Sinch
  'SINCH_KEY_ID',
  'SINCH_KEY_SECRET',
  'SINCH_PROJECT_ID',
  'SINCH_FAX_NUMBER',

  // Provider: Telnyx
  'TELNYX_API_KEY',
  'TELNYX_CONNECTION_ID',
  'TELNYX_WEBHOOK_SECRET',
];

module.exports = function validateEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(` - ${key}`));

    console.error(
      '\nFaxNova cannot start without these variables. ' +
      'Update your environment or .env file and try again.\n'
    );

    process.exit(1);
  }

  console.log('✅ Environment variables validated.');
};
