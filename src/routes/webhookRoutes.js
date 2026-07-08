// src/routes/webhookRoutes.js — Unified Fax Architecture (CommonJS Only)

const express = require("express");
const router = express.Router();

const webhookController = require("../controllers/webhookController");
const webhookSignatureGuard = require("../middleware/webhookSignatureGuard");

// Unified provider webhook endpoint
router.post(
  "/provider",
  webhookSignatureGuard,
  webhookController.handleWebhook
);

module.exports = router;
