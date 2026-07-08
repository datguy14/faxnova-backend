// src/routes/tenantRoutes.js — Unified Fax Architecture (CommonJS Only)

const express = require("express");
const router = express.Router();

const tenantController = require("../controllers/tenantController");

// Protected by apiKeyGuard in app.js

router.post("/", tenantController.createTenant);
router.get("/", tenantController.listTenants);
router.get("/:tenantId", tenantController.getTenant);

module.exports = router;
