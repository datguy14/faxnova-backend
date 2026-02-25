require('dotenv').config();
const express = require('express');

const app = express();

// Load fax routes (matches routes/fax.js)
const faxRoutes = require('./routes/fax');

app.use(express.json());

// Route prefix for all fax endpoints
app.use('/fax', faxRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`FaxNova Backend running on port ${PORT}`);
});
