const express = require("express");
const router = express.Router();

const providerLatencyController = require("../controllers/providerLatencyController");
const adminAuthGuard = require("../middleware/adminAuthGuard");

router.get("/", adminAuthGuard, providerLatencyController.getLatency);

module.exports = router;
