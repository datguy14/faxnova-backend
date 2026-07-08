// src/app.js — Strict‑Mode FaxNova Express App

const express = require("express");
const app = express();

// Raw body for webhook signature verification — MUST come first
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);

// URL-encoded parser AFTER raw-body JSON
app.use(express.urlencoded({ extended: true }));

// Global middleware
const rateLimit = require("./middleware/rateLimit");
const errorHandler = require("./middleware/errorHandler");

// Apply rate limiting ONLY to user-facing API routes
app.use("/fax", rateLimit);

// Routes
const faxRoutes = require("./routes/fax");
const telnyxWebhook = require("./providers/telnyxWebhookAdapter");
const sinchWebhook = require("./providers/sinchWebhookAdapter");

// Fax API
app.use("/fax", faxRoutes);

// Provider webhooks (no rate limit)
app.post("/webhook/telnyx", telnyxWebhook);
app.post("/webhook/sinch", sinchWebhook);

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, status: "FaxNova backend online" });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
