// server.js

require('dotenv').config();
const express = require('express');
const app = express();

// -----------------------------
// Database
// -----------------------------
const { connectToDatabase } = require('./src/db');
connectToDatabase();

// -----------------------------
// Middleware
// -----------------------------
const correlationId = require('./src/middleware/correlationId');
const requestLogger = require('./src/middleware/requestLogger');
const getTierFromApiKey = require('./src/middleware/getTierFromApiKey');
const tenantMiddleware = require('./src/middleware/tenant');
const errorHandler = require('./src/middleware/errorHandler');

const {
  freeGlobal,
  proGlobal,
  bizGlobal
} = require('./src/middleware/rateLimit');

// -----------------------------
// Routes
// -----------------------------
const faxRoutes = require('./src/routes/faxRoutes');
const faxRetryRoutes = require('./src/routes/faxRetryRoutes');
const webhookRoutes = require('./src/routes/webhookRoutes');
const auditRoutes = require('./src/routes/auditRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');

// -----------------------------
// Middleware Order (Critical)
// -----------------------------

// 1. Correlation ID for tracing
app.use(correlationId);

// 2. JSON body parsing
app.use(express.json());

// 3. Structured request logging
if (process.env.ENABLE_REQUEST_LOGGER === "true") {
  app.use(requestLogger);
}

// 4. API key → tier detection
app.use(getTierFromApiKey);

// 5. Tenant assignment (after API key)
app.use(tenantMiddleware);

// 6. Global rate limit based on tier
app.use((req, res, next) => {
  const tier = req.apiTier || 'free';

  if (tier === 'pro') return proGlobal(req, res, next);
  if (tier === 'business') return bizGlobal(req, res, next);

  return freeGlobal(req, res, next);
});

// -----------------------------
// Health Check
// -----------------------------
app.get('/health', (req, res) => {
  res.json({ success: true, status: 'OK' });
});

// -----------------------------
// Main Routes
// -----------------------------
app.use('/fax', faxRoutes);
app.use('/fax/retry', faxRetryRoutes);
app.use('/admin/audit', auditRoutes);
app.use('/analytics', analyticsRoutes);

// -----------------------------
// Webhooks (NO API key, NO rate limits)
// -----------------------------
app.use('/webhooks', webhookRoutes);

// -----------------------------
// Error Handler (always last)
// -----------------------------
app.use(errorHandler);

// -----------------------------
// Start Server
// -----------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 FaxNova backend running on port ${PORT}`);
});
