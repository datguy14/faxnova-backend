const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const faxRoutes = require("./src/routes/faxRoutes.js");
const providerRoutes = require("./src/routes/providerRoutes.js");
const webhookRoutes = require("./src/routes/webhookRoutes.js");
const authRoutes = require("./src/routes/authRoutes.js");
const residencyGuard = require("./src/middleware/residencyGuard.js");
const errorHandler = require("./src/middleware/errorHandler.js");
const db = require("./src/db.js");

const app = express();

// -----------------------------
// Global Middleware
// -----------------------------
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// Basic rate limiter
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 100
  })
);

// Residency guard (Zero‑Trust Sovereignty)
app.use(residencyGuard);

// -----------------------------
// Routes
// -----------------------------
app.use("/fax", faxRoutes);
app.use("/providers", providerRoutes);
app.use("/webhooks", webhookRoutes);
app.use("/auth", authRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// -----------------------------
// Error Handler
// -----------------------------
app.use(errorHandler);

// -----------------------------
// Start Server
// -----------------------------
const PORT = process.env.PORT || 3000;

db.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`FaxNova backend running on port ${PORT}`);
  });
});

module.exports = app;
