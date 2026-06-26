// src/app.js
const express = require("express");
const cors = require("cors");

const analyticsRoutes = require("./routes/analyticsRoutes.js");
const faxRoutes = require("./routes/faxRoutes.js");
const providerRoutes = require("./routes/providerRoutes.js");
const adminAnalyticsRoutes = require("./routes/adminAnalytics.js");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/analytics", analyticsRoutes);
app.use("/fax", faxRoutes);
app.use("/provider", providerRoutes);
app.use("/admin/analytics", adminAnalyticsRoutes);

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

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
