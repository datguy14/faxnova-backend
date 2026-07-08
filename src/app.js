// src/app.js — Unified Fax Architecture (CommonJS Only)

const express = require("express");
const app = express();

// ---------------------------------------------
// Global Middleware
// ---------------------------------------------
app.use(express.json());

// Guards
const apiKeyGuard = require("./middleware/apiKeyGuard");
const webhookSignatureGuard = require("./middleware/webhookSignatureGuard");

// ---------------------------------------------
// Route Imports
// ---------------------------------------------
const outboundFaxRoutes = require("./routes/outboundFaxRoutes");
const inboundFaxRoutes = require("./routes/inboundFaxRoutes"); // optional
const webhookRoutes = require("./routes/webhookRoutes");
const tenantRoutes = require("./routes/tenantRoutes");
const authRoutes = require("./routes/authRoutes");

// ---------------------------------------------
// Route Mounting (Unified Architecture)
// ---------------------------------------------

// Outbound Fax Pipeline
app.use("/fax/outbound", apiKeyGuard, outboundFaxRoutes);

// Inbound Fax Pipeline (optional, if you expose inbound status)
app.use("/fax/inbound", apiKeyGuard, inboundFaxRoutes);

// Provider Webhooks (inbound + outbound events)
app.use("/webhook", webhookRoutes);

// Tenant Management
app.use("/tenants", apiKeyGuard, tenantRoutes);

// Admin Authentication
app.use("/auth", authRoutes);

// ---------------------------------------------
// Health Check
// ---------------------------------------------
app.get("/health", (req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

// ---------------------------------------------
// Export App
// ---------------------------------------------
module.exports = app;
