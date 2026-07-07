// src/app.js — Fully Updated, Production‑Ready (CommonJS Only)

const express = require("express");
const cors = require("cors");

// Controllers
const faxController = require("./controllers/faxController");
const inboundFaxController = require("./controllers/inboundFaxController");
const webhookController = require("./controllers/webhookController");
const authController = require("./controllers/authController");

// Middleware
const residencyGuard = require("./middleware/residencyGuard");
const apiKeyGuard = require("./middleware/apiKeyGuard");        // NEW (required)
const rateLimitGuard = require("./middleware/rateLimitGuard");  // NEW (required)
const webhookSignatureGuard = require("./middleware/webhookSignatureGuard"); // NEW

const app = express();

// Core middleware
app.use(cors());
app.use(express.json());

// Residency enforcement (your existing logic + production requirement)
app.use(residencyGuard);

// API key validation (required for multi‑tenant SaaS)
app.use(apiKeyGuard);

// Rate limiting (required for abuse protection)
app.use(rateLimitGuard);

// -------------------------------
// AUTH
// -------------------------------
app.post("/admin/login", authController.adminLogin);

// -------------------------------
// OUTBOUND FAX
// -------------------------------
app.post("/fax/outbound", faxController.createFax);

// -------------------------------
// INBOUND FAX
// -------------------------------
app.post("/fax/inbound", inboundFaxController.receiveInboundFax);

// -------------------------------
// PROVIDER WEBHOOKS
// -------------------------------
// Webhooks MUST be signature‑verified before hitting controller logic
app.post(
  "/webhook/provider",
  webhookSignatureGuard,
  webhookController.handleWebhook
);

module.exports = app;
