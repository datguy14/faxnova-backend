const REQUIRED_ENV = [
  'JWT_SECRET',
  'MONGO_URI',
  'REDIS_HOST',
  'REDIS_PORT',
  'REDIS_PASSWORD',
  'WEBHOOK_SECRET'
];

module.exports = function validateEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("Missing required environment variables:", missing);
    process.exit(1);
  }
};
