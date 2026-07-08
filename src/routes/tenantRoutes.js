// src/routes/tenantRoutes.js — Unified Fax Architecture

const express = require("express");
const router = express.Router();

const tenantController = require("../controllers/tenantController");

// All tenant routes already protected by apiKeyGuard in app.js

// Get tenant details
router.get("/", tenantController.getTenant);

// Update tenant metadata
router.put("/", tenantController.updateTenant);

// Update residency rules
router.put("/residency", tenantController.updateResidencyRules);

// Update webhook settings
router.put("/webhook", tenantController.updateWebhookSettings);

module.exports = router;
