// server.js
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const logger = require('./src/utils/logger');

const app = express();

// =====================
// Middleware
// =====================
app.use(helmet());                         // Security headers
app.use(cors());                           // Enable CORS
app.use(express.json({ limit: '25mb' }));  // Increased limit for document uploads
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}

// =====================
// Routes
// =====================

// Main Fax API Routes
app.use('/fax', require('./src/routes/faxRoutes'));

// Agent API Routes (NEW)
app.use('/agents', require('./src/routes/agentRoutes'));

// Swagger UI Documentation
app.use('/docs', require('./src/routes/docsRoutes'));

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '1.1.0',
        multiProvider: true,
        defaultProvider: process.env.DEFAULT_FAX_PROVIDER || 'sinch',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: "Welcome to FaxNova Backend",
        version: "1.1.0",
        documentation: "/docs",
        api: "/fax",
        agents: "/agents",
        status: "running"
    });
});

// =====================
// Start Server
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`FaxNova Backend running on port ${PORT}`);
});

module.exports = app;
