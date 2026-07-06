// src/server.js

require("dotenv").config();

const app = require("./app");
const { connectMongo } = require("./lib/mongo");
require("./lib/redis");

// Boot workers
require("./workers/outboundFaxWorker");
require("./workers/retryFaxWorker");
require("./workers/webhookWorker");

// Start server
const PORT = process.env.PORT || 3000;

(async () => {
  await connectMongo();
  app.listen(PORT, () => {
    console.log(`FaxNova backend running on port ${PORT}`);
  });
})();
