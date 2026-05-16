require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('./src/middleware/rateLimit');
const validateEnv = require('./src/utils/validateEnv');

const faxRoutes = require('./src/routes/faxRoutes');
const faxRetryRoutes = require('./src/routes/faxRetryRoutes');
const faxStatusRoutes = require('./src/routes/faxStatusRoutes');
const faxWebhookRoutes = require('./src/routes/faxWebhookRoutes');
const faxEventHistoryRoutes = require('./src/routes/faxEventHistoryRoutes');
const auditViewerRoutes = require('./src/routes/auditViewerRoutes');

validateEnv();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use(rateLimit);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'faxnova-backend',
    env: process.env.NODE_ENV || 'development'
  });
});

// Mount all fax-related routes
app.use('/fax', faxRoutes);
app.use('/fax', faxRetryRoutes);
app.use('/fax', faxStatusRoutes);
app.use('/fax', faxWebhookRoutes);        // ✅ Added webhook route
app.use('/fax', faxEventHistoryRoutes);

// Audit viewer
app.use('/', auditViewerRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    details: err.details || null,
    correlationId: req.correlationId || null
  });
});

// Start server unless in test mode
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 10000;
  app.listen(PORT, () => {
    console.log(`FaxNova Backend running on port ${PORT}`);
  });
}

module.exports = app;
