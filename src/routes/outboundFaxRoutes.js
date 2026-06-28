// src/routes/outboundFaxRoutes.js

const express = require("express");
const router = express.Router();

const { outboundFax } = require("../controllers/outboundFaxController");
const { residencyGuard } = require("../middleware/residencyGuard");

/**
 * POST /fax/send
 *
 * Sends an outbound fax using Routing Engine v2.
 * residencyGuard ensures sovereignty + residency compliance.
 */
router.post("/send", residencyGuard, outboundFax);

module.exports = router;
