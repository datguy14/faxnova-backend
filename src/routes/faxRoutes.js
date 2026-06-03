const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const agentAuth = require("../middleware/agentAuth");
const faxController = require("../controllers/faxController");

// Protect all routes
router.use(agentAuth);

// Rate limiter
const faxSendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) =>
    req.headers["x-forwarded-for"]?.split(",")[0] || req.ip,
});

// SEND FAX
router.post("/send", faxSendLimiter, faxController.sendFax);

// GET FAX STATUS
router.get("/:id/status", faxController.getFaxStatus);

module.exports = router;
