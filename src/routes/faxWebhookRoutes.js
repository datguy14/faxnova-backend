import express from 'express';
import { handleFaxWebhook } from '../controllers/faxWebhookController.js';
import { residencyGuard } from '../middleware/residencyGuard.js';

const router = express.Router();

/**
 * POST /webhook
 * Handle fax delivery status webhooks from providers
 * 
 * Headers:
 *   x-country: ISO 3166-1 alpha-2 country code (optional)
 *   Provider-specific headers (x-sinch-signature, x-telnyx-timestamp, etc.)
 * 
 * Residency-aware: Routes webhook processing to correct zone storage
 * Logs delivery status updates to zone-partitioned logs
 */
router.post('/webhook', residencyGuard, handleFaxWebhook);

export default router;
