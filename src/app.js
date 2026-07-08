// src/app.js — Strict‑Mode FaxNova Express App

const express = require("express");
const app = express();

// Core middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Raw body for webhook signature verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);

// Global middleware
const rateLimit = require("./middleware/rateLimit");
const errorHandler = require("./middleware/errorHandler");

app.use(rateLimit);

// Routes
const faxRoutes = require("./routes/fax");
const telnyxWebhook = require("./providers/telnyxWebhookAdapter");
const sinchWebhook = require("./providers/sinchWebhookAdapter");

// Fax API
app.use("/fax", faxRoutes);

// Provider webhooks
app.post("/webhook/telnyx", telnyxWebhook);
app.post("/webhook/sinch", sinchWebhook);

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, status: "FaxNova backend online" });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
