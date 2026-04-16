const express = require('express');
const router = express.Router();
const { retryFaxController } = require('../controllers/faxRetryController');

// POST /fax/retry/:faxId
router.post('/:faxId', retryFaxController);

module.exports = router;
