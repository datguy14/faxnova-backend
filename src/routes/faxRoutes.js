const express = require("express");
const { sendFax, getFaxStatus, retryFax } = require("../controllers/fax.controller.js");
const auth = require("../middleware/auth.js");
const { faxLimiter } = require("../middleware/rateLimit.js");

const router = express.Router();

/**
 * POST /fax/send
 * Send a fax using provider routing + residency + failover logic.
 */
router.post("/send", auth, faxLimiter, sendFax);

/**
 * GET /fax/:id
 * Retrieve fax status (queued, sending, sent, failed).
 */
router.get("/:id", auth, getFaxStatus);

/**
 * POST /fax/:id/retry
 * Retry a failed fax using provider failover logic.
 */
router.post("/:id/retry", auth, faxLimiter, retryFax);

module.exports = router;
