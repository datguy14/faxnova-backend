const express = require("express");
const router = express.Router();

const providerMetricsController = require("../controllers/providerMetricsController");
const adminAuthGuard = require("../middleware/adminAuthGuard");

router.get("/", adminAuthGuard, providerMetricsController.getMetrics);

module.exports = router;
