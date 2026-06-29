// src/server.js

require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

// ---------------------------
// Database Connection
// ---------------------------
connectDB();

// ---------------------------
// Start Multi‑Region Workers
// ---------------------------

// US region workers
require("./queue/faxWorker.us");
require("./queue/retryWorker.us");

// EU region workers
require("./queue/faxWorker.eu");
require("./queue/retryWorker.eu");

// ---------------------------
// Server Startup
// ---------------------------
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 FaxNova backend running on port ${PORT}`);
});
