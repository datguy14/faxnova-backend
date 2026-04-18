const express = require('express');
const router = express.Router();

const { sendFax, getFaxStatus } = require('../controllers/faxController');
const validateSendFax = require('../middleware/validateSendFax');

// POST /fax/send
router.post('/send', validateSendFax, sendFax);

// GET /fax/status/:faxId   ← ADD THIS RIGHT HERE
router.get('/status/:faxId', getFaxStatus);

module.exports = router;
