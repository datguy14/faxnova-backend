import express from "express";
import { sendFax, getFaxStatus } from "../controllers/faxController.js";
import { residencyGuard } from "../middleware/residencyGuard.js";

const router = express.Router();

/**
 * POST /fax/send
 * Send a fax through a residency-compliant provider
 * 
 * Headers:
 *   x-country: ISO 3166-1 alpha-2 country code (optional, defaults to US)
 * 
 * Body:
 *   to: string (required) - recipient fax number
 *   fileUrl: string (required) - URL to fax document
 *   provider: string (optional) - preferred provider (sinch or telnyx)
 * 
 * Response includes residencyZone and routing metadata
 */
router.post("/send", residencyGuard, sendFax);

/**
 * GET /fax/:provider/:faxId/status
 * Check fax delivery status
 * 
 * Params:
 *   provider: sinch or telnyx
 *   faxId: fax ID from provider
 * 
 * Headers:
 *   x-country: ISO 3166-1 alpha-2 country code (optional, defaults to US)
 */
router.get("/:provider/:faxId/status", residencyGuard, getFaxStatus);

export default router;
