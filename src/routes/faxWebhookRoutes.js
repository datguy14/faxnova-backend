import express from 'express';
import { handleFaxWebhook } from '../controllers/faxWebhookController.js';

const router = express.Router();

// POST /fax/webhook
router.post('/webhook', handleFaxWebhook);

export default router;
