// src/routes/adminAnalytics.js
const express = require("express");
const router = express.Router();

const adminAnalyticsController = require("../controllers/adminAnalyticsController");
const auth = require("../middleware/auth");

router.get("/logs", auth, adminAnalyticsController.list);

module.exports = router;
