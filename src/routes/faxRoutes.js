// src/routes/faxRoutes.js — Unified Fax Architecture

const express = require("express");
const router = express.Router();

const faxController = require("../controllers/faxController");

// All fax routes already protected by apiKeyGuard in app.js

// List all faxes for the authenticated tenant
router.get("/", faxController.listFaxes);

// Get a single fax
router.get("/:faxId", faxController.getFax);

// Delete a fax
router.delete("/:faxId", faxController.deleteFax);

module.exports = router;
