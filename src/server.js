// src/server.js — Strict‑Mode CommonJS Version

const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");

// Boot workers
require("./workers/outboundFaxWorker");
require("./workers/retryFaxWorker");
require("./workers/webhookWorker");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 FaxNova backend running on port ${PORT}`);
});
