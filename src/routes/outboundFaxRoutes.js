// src/routes/outboundFaxRoutes.js — Unified Fax Architecture (CommonJS Only)

const express = require("express");
const router = express.Router();

const outboundFaxController = require("../controllers/outboundFaxController");

// Protected by apiKeyGuard in app.js

router.post("/send", outboundFaxController.sendFax);

router.get("/:faxId/status", outboundFaxController.getFaxStatus);

router.post("/:faxId/retry", outboundFaxController.retryFax);

module.exports = router;
