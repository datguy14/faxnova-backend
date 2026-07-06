// src/app.js

const express = require("express");
const cors = require("cors");

const faxController = require("./controllers/faxController");
const inboundFaxController = require("./controllers/inboundFaxController");
const webhookController = require("./controllers/webhookController");
const authController = require("./controllers/authController");

const app = express();

app.use(cors());
app.use(express.json());

// Auth
app.post("/admin/login", authController.adminLogin);

// Outbound fax
app.post("/fax/outbound", faxController.createFax);

// Inbound fax
app.post("/fax/inbound", inboundFaxController.receiveInboundFax);

// Provider webhooks
app.post("/webhook/provider", webhookController.handleWebhook);

module.exports = app;
