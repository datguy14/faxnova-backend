require('dotenv').config();
const express = require('express');
const app = express();
const faxRoutes = require('./routes/fax');

app.use(express.json());
app.use('/fax', faxRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
