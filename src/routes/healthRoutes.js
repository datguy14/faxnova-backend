const express = require("express");
const router = express.Router();

const healthController = require("../controllers/healthController");
const adminAuthGuard = require("../middleware/adminAuthGuard");

router.get("/", adminAuthGuard, healthController.getHealth);

module.exports = router;
