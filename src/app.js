// src/app.js — Fully corrected CommonJS version

const express = require("express");
const cors = require("cors");

const analyticsRoutes = require("./routes/analyticsRoutes.js");
const faxRoutes = require("./routes/faxRoutes.js");
const providerRoutes = require("./routes/providerRoutes.js");
const adminAnalyticsRoutes = require("./routes/adminAnalytics.js");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/analytics", analyticsRoutes);
app.use("/fax", faxRoutes);
app.use("/provider", providerRoutes);
app.use("/admin/analytics", adminAnalyticsRoutes);

// Health check
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

module.exports = app;
