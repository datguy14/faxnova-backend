// src/routes/adminAnalytics.js

const express = require("express");
const router = express.Router();

const adminAnalyticsController = require("../controllers/adminAnalyticsController");

const auth = require("../middleware/auth");
const residencyGuard = require("../middleware/residencyGuard");
const { analyticsLimiter } = require("../middleware/rateLimit");

// -----------------------------
// Admin Analytics Routes
// -----------------------------

// GET /admin/analytics/usage
router.get(
  "/usage",
  auth,
  analyticsLimiter,
  residencyGuard(),
  adminAnalyticsController.getGlobalUsage
);

module.exports = router;
