// src/routes/faxRoutes.js

const express = require("express");
const router = express.Router();

const faxController = require("../controllers/faxController");
const authMiddleware = require("../middleware/authMiddleware");

// All fax routes require authentication
router.use(authMiddleware);

// List all faxes for a tenant
router.get("/:tenantId", faxController.listFaxes);

// Get a single fax
router.get("/:tenantId/:faxId", faxController.getFax);

// Delete a fax
router.delete("/:tenantId/:faxId", faxController.deleteFax);

module.exports = router;
