const express = require('express');
const router = express.Router();
const { sendFax } = require('../controllers/faxController');

router.post('/send', sendFax);

module.exports = router;
