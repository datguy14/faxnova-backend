require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Middleware
const requestLogger = require('./middleware/requestLogger');
const correlationId = require('./middleware/correlationId');
const errorHandler = require('./middleware/errorHandler');

// Routes
const faxRoutes = require('./routes/faxRoutes');

const app = express();

// Global middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(morgan('dev'));
app.use(correlationId);
app.use(requestLogger);

// Routes
app.use('/fax', faxRoutes);

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
