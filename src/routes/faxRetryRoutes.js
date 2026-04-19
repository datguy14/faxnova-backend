const express = require('express');
const router = express.Router();
const { retryFaxController } = require('../controllers/faxRetryController');

// POST /fax/:faxId/retry
router.post('/:faxId/retry', retryFaxController);

module.exports = router;
