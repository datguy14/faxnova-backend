const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { retryFaxController } = require('../controllers/faxRetryController');

const RESERVED_IDS = ['send', 'status', 'history', 'webhook', 'health'];

function rejectReservedFaxId(req, res, next) {
  const { faxId } = req.params;
  if (RESERVED_IDS.includes(faxId.toLowerCase())) {
    return res.status(400).json({
      error: 'Invalid faxId',
      details: `'${faxId}' is a reserved path segment`,
    });
  }
  next();
}

// POST /fax/:faxId/retry — protected
router.post('/:faxId/retry', auth, rejectReservedFaxId, retryFaxController);

module.exports = router;
