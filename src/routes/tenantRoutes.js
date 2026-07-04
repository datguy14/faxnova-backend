// src/routes/tenantRoutes.js

const express = require("express");
const router = express.Router();

const tenantController = require("../controllers/tenantController");
const authMiddleware = require("../middleware/authMiddleware");

// All tenant routes require authentication
router.use(authMiddleware);

// Get tenant details
router.get("/:tenantId", tenantController.getTenant);

// Update tenant metadata
router.put("/:tenantId", tenantController.updateTenant);

// Update residency rules
router.put("/:tenantId/residency", tenantController.updateResidencyRules);

// Update webhook settings
router.put("/:tenantId/webhook", tenantController.updateWebhookSettings);

module.exports = router;
