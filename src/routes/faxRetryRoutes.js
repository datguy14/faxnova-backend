// src/routes/faxRetryRoutes.js

const express = require("express");
const router = express.Router();

const { retryFax } = require("../controllers/faxRetryController");
const { residencyGuard } = require("../middleware/residencyGuard");

/**
 * POST /fax/:faxId/retry
 *
 * Retry a failed outbound fax using Routing Engine v2.
 * residencyGuard ensures outbound retry complies with
 * sovereignty + residency rules.
 *
 * Headers:
 *   x-country: ISO 3166-1 alpha-2 country code (optional)
 *
 * Params:
 *   faxId: MongoDB OutboundFax record ID
 */
router.post("/:faxId/retry", residencyGuard, retryFax);

module.exports = router;
