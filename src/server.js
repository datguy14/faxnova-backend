// src/server.js

require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.json());

// Controllers
const faxController = require("./controllers/faxController");
const inboundFaxController = require("./controllers/inboundFaxController");

// Workers (auto-start)
require("./workers/outboundFaxWorker");
require("./workers/webhookWorker");
require("./workers/retryFaxWorker");

// Routes
app.post("/fax/send", faxController.sendFax);
app.post("/fax/inbound/:provider", inboundFaxController.receiveFax);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`FaxNova strict-mode backend running on port ${PORT}`);
});
