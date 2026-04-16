const requestLogger = require('./src/middleware/requestLogger');
app.use(requestLogger);
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Route imports
const faxRoutes = require('./src/routes/faxRoutes');
const faxStatusRoutes = require('./src/routes/faxStatusRoutes');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(morgan('dev'));

// Routes
app.use('/fax', faxRoutes);
app.use('/fax/status', faxStatusRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`FaxNova Backend running on port ${PORT}`);
});
