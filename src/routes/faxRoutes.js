const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validateSendFax = require('../middleware/validateSendFax');
const { sendFax } = require('../controllers/faxController');

// POST /fax/send — protected
router.post('/send', auth, validateSendFax, sendFax);

module.exports = router;
