const express = require('express');
const { handleFaxWebhook } = require('../controllers/faxWebhookController');

const router = express.Router();

router.post('/webhook', handleFaxWebhook);

module.exports = router;
