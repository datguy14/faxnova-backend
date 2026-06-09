// src/routes/faxRetryRoutes.js

const express = require('express');
const router = express.Router();
const { retryFaxController } = require('../controllers/faxRetryController');
const { residencyGuard } = require('../middleware/residencyGuard');

/**
 * POST /fax/:faxId/retry
 * Retry a failed fax delivery through residency-compliant provider
 * 
 * Headers:
 *   x-country: ISO 3166-1 alpha-2 country code (optional)
 * 
 * Params:
 *   faxId: MongoDB fax record ID
 * 
 * Residency-aware: Uses fax's stored residencyZone for failover
 */
router.post('/:faxId/retry', residencyGuard, retryFaxController);

module.exports = router;
