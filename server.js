// server.js

require('dotenv').config();
const express = require('express');
const app = express();

// -----------------------------
// Middleware
// -----------------------------
const correlationId = require('./src/middleware/correlationId');
const requestLogger = require('./src/middleware/requestLogger');
const errorHandler = require('./src/middleware/errorHandler');
const getTierFromApiKey = require('./src/middleware/getTierFromApiKey');

const {
  freeGlobal,
  proGlobal,
  bizGlobal
} = require('./src/middleware/rateLimit');

// -----------------------------
// Routes
// -----------------------------
const faxRoutes = require('./src/routes/faxRoutes');

// -----------------------------
// Core Middleware Order
// -----------------------------

// 1. Correlation ID for tracing
app.use(correlationId);

// 2. JSON body parsing
app.use(express.json());

// 3. Request logging
app.use(requestLogger);

// 4. API key → tier detection
app.use(getTierFromApiKey);

// 5. Global rate limit based on tier
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

// -----------------------------
// Error Handler (always last)
// -----------------------------
app.use(errorHandler);

// -----------------------------
// Start Server
// -----------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`FaxNova backend running on port ${PORT}`);
});
