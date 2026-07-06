// src/server.js — Strict‑Mode Final Version
require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const mongoose = require("mongoose");

const validateEnv = require("./utils/validateEnv");
const errorHandler = require("./middleware/errorHandler");

// Validate environment variables before starting
validateEnv();

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const allowed = [
        "https://app.faxnova.com",
        "https://admin.faxnova.com",
        "http://localhost:3000"
      ];
      if (allowed.includes(origin) || origin.endsWith(".faxnova.com")) {
        return cb(null, true);
      }
      cb(new Error("CORS: Origin not allowed"));
    },
    credentials: true
  })
);

app.use(express.json({ limit: "10mb" }));

// Webhooks — NO AUTH
const webhookRoutes = require("./routes/webhookRoutes");
app.use("/webhooks", webhookRoutes);

// Protected API routes
app.use("/api", require("./middleware/authMiddleware"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/faxes", require("./routes/faxRoutes"));
app.use("/api/providers", require("./routes/providerRoutes"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler — MUST be last
app.use(errorHandler);

// Start workers (auto‑boot)
require("./workers/outboundFaxWorker");
require("./workers/retryFaxWorker");
require("./workers/webhookWorker");

// Database + Server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 FaxNova backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
