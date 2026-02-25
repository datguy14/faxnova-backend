require('dotenv').config();
const express = require('express');

const app = express();
const faxRoutes = require('./routes/faxRoutes'); // ensure filename matches

app.use(express.json());
app.use('/fax', faxRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`FaxNova Backend running on port ${PORT}`);
});
