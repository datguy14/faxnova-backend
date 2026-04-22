const required = [
  'SINCH_API_KEY',
  'SINCH_API_SECRET',
  'SINCH_FAX_REGION',
  'SINCH_FAX_NUMBER',
];

module.exports = function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    process.exit(1);
  }
};
