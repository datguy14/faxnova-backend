// src/app.js

const express = require("express");
const cors = require("cors");

// Routes
const faxRoutes = require("./routes/faxRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const providerRoutes = require("./routes/providerRoutes");
const adminAnalyticsRoutes = require("./routes/adminAnalytics");

// Middleware
const auth = require("./middleware/auth");

// App init
const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Routes
app.use("/fax", faxRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/provider", providerRoutes);
app.use("/admin/analytics", auth, adminAnalyticsRoutes);

// ---------------------------
// Global Error Handler
// ---------------------------
app.use((err, req, res, next) => {
  console.error("FaxNova Error:", err);

  // Zod validation errors
  if (err.name === "ZodError") {
    return res.status(400).json({
      error: "Invalid request payload",
      issues: err.errors
    });
  }

  // Normalized FaxNovaError
  res.status(500).json({
    error: err.message,
    provider: err.provider || null,
    code: err.code || "UNKNOWN_ERROR",
    details: err.details || null
  });
});

module.exports = app;
// Global error handler (place at bottom of src/app.js)

app.use((err, req, res, next) => {
  console.error("FaxNova Error:", err);

  res.status(500).json({
    error: err.message,
    provider: err.provider || null,
    code: err.code || "UNKNOWN_ERROR",
    details: err.details || null
  });
});
