require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const app = express();

// --------------------
// Global Middleware
// --------------------
app.use(express.json({ limit: "10mb" }));
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));

app.use(
  rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 200,
  })
);

// --------------------
// Unified Route Imports
// --------------------
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");          // merged admin router
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const analyticsRoutes = require("./src/routes/analyticsRoutes");

const faxRoutes = require("./src/routes/faxRoutes");              // merged fax router
const inboundFaxRoutes = require("./src/routes/inboundFaxRoutes");

const providerRoutes = require("./src/routes/providerRoutes");
const webhookRoutes = require("./src/routes/webhookRoutes");

// --------------------
// Unified Route Mounting
// --------------------
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use("/api/faxes", faxRoutes);
app.use("/api/faxes/inbound", inboundFaxRoutes);

app.use("/api/providers", providerRoutes);

// External provider callbacks (no auth)
app.use("/webhooks", webhookRoutes);

// --------------------
// Health Check
// --------------------
app.get("/health", (req, res) => {
  res.json({ success: true, status: "FaxNova backend operational" });
});

// --------------------
// Database Connection
// --------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("📡 Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --------------------
// Start Server
// --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 FaxNova backend running on port ${PORT}`);
});
