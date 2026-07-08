const express = require("express");
const router = express.Router();

const globalConfigController = require("../controllers/globalConfigController");
const adminAuthGuard = require("../middleware/adminAuthGuard");
const rbacGuard = require("../middleware/rbacGuard");

router.get("/", adminAuthGuard, rbacGuard("config"), globalConfigController.getConfig);
router.post("/", adminAuthGuard, rbacGuard("config"), globalConfigController.updateConfig);

module.exports = router;
