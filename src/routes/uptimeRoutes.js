const express = require("express");
const router = express.Router();

const uptimeController = require("../controllers/uptimeController");
const adminAuthGuard = require("../middleware/adminAuthGuard");

router.get("/", adminAuthGuard, uptimeController.getUptime);

module.exports = router;
