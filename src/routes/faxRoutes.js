// src/routes/faxRoutes.js

const express = require("express");
const router = express.Router();

const faxController = require("../controllers/faxController");

// Queue a new outbound fax (async)
router.post("/send", faxController.sendFax);

// Get fax by faxId (OutboundFax only)
router.get("/:faxId", faxController.getFaxById);

// List all faxes for a tenant
router.get("/tenant/:tenantId", faxController.listFaxes);

module.exports = router;
