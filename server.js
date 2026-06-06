import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// IMPORTANT: Your db.js is in /config, not /src/config
import connectDB from './config/db.js';

import faxRoutes from './src/routes/faxRoutes.js';
import faxWebhookRoutes from './src/routes/faxWebhookRoutes.js';
import logger from './src/utils/logger.js';

dotenv.config();

// -----------------------------
// Connect to MongoDB FIRST
// -----------------------------
connectDB();

// -----------------------------
// Initialize Express
// -----------------------------
const app = express();

// -----------------------------
// Global Middleware
// -----------------------------
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Morgan → pipe logs into your logger utility
app.use(
  morgan('combined', {
    stream: {
      write: (msg) => logger.info(msg.trim())
    }
  })
);

// -----------------------------
// Health Check
// -----------------------------
app.get('/health', (req, res) => {
  logger.info('Health check pinged');
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// -----------------------------
// Routes
// -----------------------------
app.use('/fax', faxRoutes);
app.use('/fax', faxWebhookRoutes);

// -----------------------------
// 404 Handler
// -----------------------------
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

// -----------------------------
// Global Error Handler
// -----------------------------
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// -----------------------------
// Start Server
// -----------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`FaxNova backend running on port ${PORT}`);
});
