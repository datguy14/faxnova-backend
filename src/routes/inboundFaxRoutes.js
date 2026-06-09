// src/routes/inboundFaxRoutes.js

const express = require('express');
const router = express.Router();
const { handleInboundFax } = require('../controllers/inboundFaxController');
const { residencyGuard } = require('../middleware/residencyGuard');

/**
 * POST /webhook/inbound
 * Handle inbound fax webhooks from Sinch/Telnyx
 * 
 * Headers:
 *   x-country: ISO 3166-1 alpha-2 country code (optional)
 *   Determined by webhook provider's IP geolocation
 * 
 * Residency-aware: Logs inbound fax to correct zone storage
 * Webhook provider headers (Sinch-specific):
 *   x-sinch-timestamp, x-sinch-signature
 */
router.post('/inbound', residencyGuard, handleInboundFax);

module.exports = router;
