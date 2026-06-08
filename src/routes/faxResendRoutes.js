// src/routes/faxResendRoutes.js

const express = require('express');
const router = express.Router();
const { resendFaxController } = require('../controllers/faxResendController');
const { residencyGuard } = require('../middleware/residencyGuard');

/**
 * POST /fax/:faxId/resend
 * Resend a previously sent fax through residency-compliant provider
 * 
 * Headers:
 *   x-country: ISO 3166-1 alpha-2 country code (optional)
 * 
 * Params:
 *   faxId: MongoDB fax record ID
 * 
 * Residency-aware: Uses fax's stored residencyZone if available, or detects from header
 */
router.post('/:faxId/resend', residencyGuard, resendFaxController);

module.exports = router;
