// server.js

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
// Route Imports
// --------------------
const adminDashboardRoutes = require("./src/routes/adminDashboardRoutes");
const adminAnalyticsRoutes = require("./src/routes/adminAnalytics");
const analyticsRoutes = require("./src/routes/analyticsRoutes");
const agentRoutes = require("./src/routes/agentRoutes");
const auditRoutes = require("./src/routes/auditRoutes");
const auditViewerRoutes = require("./src/routes/auditViewerRoutes");
const authRoutes = require("./src/routes/authRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const docsRoutes = require("./src/routes/docsRoutes");

const faxRoutes = require("./src/routes/faxRoutes");
const faxDeleteRoutes = require("./src/routes/faxDeleteRoutes");
const faxDownloadRoutes = require("./src/routes/faxDownloadRoutes");
const faxEventHistoryRoutes = require("./src/routes/faxEventHistoryRoutes");
const faxResendRoutes = require("./src/routes/faxResendRoutes");
const faxRetryRoutes = require("./src/routes/faxRetryRoutes");
const faxStatusRoutes = require("./src/routes/faxStatusRoutes");
const faxWebhookRoutes = require("./src/routes/faxWebhookRoutes");

const inboundFaxRoutes = require("./src/routes/inboundFaxRoutes");
const outboundFaxRoutes = require("./src/routes/outboundFaxRoutes");

const providerRoutes = require("./src/routes/providerRoutes");
const webhookRoutes = require("./src/routes/webhookRoutes");

// --------------------
// Route Mounting
// --------------------
app.use("/admin/dashboard", adminDashboardRoutes);
app.use("/admin/analytics", adminAnalyticsRoutes);

app.use("/analytics", analyticsRoutes);
app.use("/agent", agentRoutes);
app.use("/audit", auditRoutes);
app.use("/audit/viewer", auditViewerRoutes);
app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/docs", docsRoutes);

app.use("/fax", faxRoutes);
app.use("/fax/delete", faxDeleteRoutes);
app.use("/fax/download", faxDownloadRoutes);
app.use("/fax/history", faxEventHistoryRoutes);
app.use("/fax/resend", faxResendRoutes);
app.use("/fax/retry", faxRetryRoutes);
app.use("/fax/status", faxStatusRoutes);
app.use("/fax/webhook", faxWebhookRoutes);

app.use("/inbound", inboundFaxRoutes);
app.use("/outbound", outboundFaxRoutes);

app.use("/provider", providerRoutes);
app.use("/webhook", webhookRoutes);

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
