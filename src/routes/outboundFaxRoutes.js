// src/routes/outboundFaxRoutes.js

const express = require("express");
const router = express.Router();

const outboundFaxController = require("../controllers/outboundFaxController");
const authMiddleware = require("../middleware/authMiddleware");

// All outbound fax routes require authentication
router.use(authMiddleware);

// Submit outbound fax
router.post("/:tenantId/send", outboundFaxController.sendFax);

// Get outbound fax status
router.get("/:tenantId/:faxId/status", outboundFaxController.getFaxStatus);

// Retry outbound fax
router.post("/:tenantId/:faxId/retry", outboundFaxController.retryFax);

module.exports = router;
