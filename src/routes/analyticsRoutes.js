const express = require("express");
const router = express.Router();

const analyticsController = require("../controllers/analyticsController");
const adminAuthGuard = require("../middleware/adminAuthGuard");

router.get("/system", adminAuthGuard, analyticsController.systemOverview);
router.get("/tenant/:tenantId", adminAuthGuard, analyticsController.tenantOverview);

module.exports = router;
