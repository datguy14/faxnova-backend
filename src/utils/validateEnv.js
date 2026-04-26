const required = [
  'SINCH_KEY_ID',
  'SINCH_KEY_SECRET',
  'SINCH_PROJECT_ID',
  'SINCH_FAX_NUMBER',
];

module.exports = function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('\u274c Missing required environment variables:', missing);
    process.exit(1);
  }

  console.log('\u2705 Environment variables validated.');
};
