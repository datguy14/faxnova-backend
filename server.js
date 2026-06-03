// server.js (root)
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// -----------------------------
// Core middleware
// -----------------------------
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// -----------------------------
// Database connection
// -----------------------------
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!mongoUri) {
  console.error("❌ Missing MONGODB_URI / MONGO_URI in environment");
  process.exit(1);
}

mongoose
  .connect(mongoUri, {
    autoIndex: true
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// -----------------------------
// Health check
// -----------------------------
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    env: process.env.NODE_ENV || "development",
    version: "1.1.0"
  });
});

// -----------------------------
// Routes
// -----------------------------
app.use("/docs", require("./src/routes/docsRoutes"));
app.use("/auth", require("./src/routes/authRoutes"));
app.use("/agents", require("./src/routes/agentRoutes"));
app.use("/fax", require("./src/routes/faxRoutes"));
app.use("/webhooks", require("./src/routes/webhookRoutes")); // Sinch/Telnyx

// -----------------------------
// 404 handler
// -----------------------------
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.originalUrl
  });
});

// -----------------------------
// Global error handler
// -----------------------------
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === "production" ? undefined : err.message
  });
});

// -----------------------------
// Start server
// -----------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 FaxNova backend running on port ${PORT}`);
});
