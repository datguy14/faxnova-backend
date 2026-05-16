require('dotenv').config();

const validateEnv = require('./src/utils/validateEnv');
validateEnv();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Middleware
const requestLogger = require('./src/middleware/requestLogger');
const correlationId = require('./src/middleware/correlationId');
const errorHandler = require('./src/middleware/errorHandler');

// Routes
const faxRoutes = require('./src/routes/faxRoutes');
const faxStatusRoutes = require('./src/routes/faxStatusRoutes');
const faxRetryRoutes = require('./src/routes/faxRetryRoutes');
const faxWebhookRoutes = require('./src/routes/faxWebhookRoutes');
const faxEventHistoryRoutes = require('./src/routes/faxEventHistoryRoutes');
const auditViewerRoutes = require('./src/routes/auditViewerRoutes');

const app = express();

// -----------------------------------------------
// 📁 Serve static files (including .well-known)
// -----------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));

// -----------------------------------------------
// 🛡 Security middleware
// -----------------------------------------------
app.use(helmet());

// -----------------------------------------------
// 🚦 Rate limiting (before JSON/CORS)
// -----------------------------------------------
const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
});
app.use('/fax/send', sendLimiter);

// -----------------------------------------------
// 🌐 Global middleware
// -----------------------------------------------
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(correlationId);
app.use(requestLogger);

// -----------------------------------------------
// 📡 Routes
// -----------------------------------------------
app.use('/fax', faxRoutes);
app.use('/fax', faxRetryRoutes);
app.use('/fax', faxWebhookRoutes);
app.use('/fax/status', faxStatusRoutes);
app.use('/fax', faxEventHistoryRoutes);

// 🔐 Secure audit viewer
app.use('/admin', auditViewerRoutes);

// -----------------------------------------------
// ❤️ Health check
// -----------------------------------------------
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'faxnova-backend',
    env: process.env.NODE_ENV || 'development',
  });
});

// -----------------------------------------------
// ❗ Error handler (must be last)
// -----------------------------------------------
app.use(errorHandler);

// -----------------------------------------------
// 🚀 Start server
// -----------------------------------------------
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`FaxNova Backend running on port ${PORT}`);
  });
}

module.exports = app;
