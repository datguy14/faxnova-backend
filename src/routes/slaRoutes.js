const express = require("express");
const router = express.Router();

const slaController = require("../controllers/slaController");
const adminAuthGuard = require("../middleware/adminAuthGuard");
const rbacGuard = require("../middleware/rbacGuard");

router.get("/", adminAuthGuard, rbacGuard("providers"), slaController.getSlaStatus);

module.exports = router;
