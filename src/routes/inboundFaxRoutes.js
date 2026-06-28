// src/routes/inboundFaxRoutes.js

const express = require("express");
const router = express.Router();

const { inboundFax } = require("../controllers/inboundFaxController");

// Provider-specific inbound adapters
const sinchInbound = require("../providers/sinchInboundAdapter");
const telnyxInbound = require("../providers/telnyxInboundAdapter");

/**
 * POST /fax/inbound/sinch
 * Sinch inbound webhook → normalized → inboundFaxController
 */
router.post("/sinch", sinchInbound, inboundFax);

/**
 * POST /fax/inbound/telnyx
 * Telnyx inbound webhook → normalized → inboundFaxController
 */
router.post("/telnyx", telnyxInbound, inboundFax);

module.exports = router;
