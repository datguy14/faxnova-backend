require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Middleware
const requestLogger = require('./src/middleware/requestLogger');
const correlationId = require('./src/middleware/correlationId');
const errorHandler = require('./src/middleware/errorHandler');

// Routes
const faxRoutes = require('./src/routes/faxRoutes');
const faxStatusRoutes = require('./src/routes/faxStatusRoutes');
const faxRetryRoutes = require('./src/routes/faxRetryRoutes');

const app = express();

// Global middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(morgan('dev'));
app.use(correlationId);
app.use(requestLogger);

// Routes
app.use('/fax', faxRoutes);
app.use('/fax', faxRetryRoutes);
app.use('/fax/status', faxStatusRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`FaxNova Backend running on port ${PORT}`);
});
