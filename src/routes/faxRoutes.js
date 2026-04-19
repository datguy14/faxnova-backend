const express = require('express');
const router = express.Router();
const { sendFax } = require('../controllers/faxController');
const validateSendFax = require('../middleware/validateSendFax');

// POST /fax/send
router.post('/send', validateSendFax, sendFax);

module.exports = router;
