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
// Routes (Unified Architecture)
// ---------------------------------------------

// Outbound Fax Pipeline
const outboundFaxRoutes = require("./routes/outboundFaxRoutes");
app.use("/fax/outbound", apiKeyGuard, outboundFaxRoutes);

// Inbound Fax Pipeline (if you want later)
const inboundFaxRoutes = require("./routes/inboundFaxRoutes");
app.use("/fax/inbound", apiKeyGuard, inboundFaxRoutes);

// Webhook Pipeline (Provider → You)
const webhookRoutes = require("./routes/webhookRoutes");
app.use("/webhook", webhookRoutes);

// Admin Auth
const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);

// Tenants (optional)
const tenantRoutes = require("./routes/tenantRoutes");
app.use("/tenants", apiKeyGuard, tenantRoutes);

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
