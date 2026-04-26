const express = require('express');
const router = express.Router();
const { retryFaxController } = require('../controllers/faxRetryController');

const RESERVED_IDS = ['send', 'status', 'history', 'webhook', 'health'];

// Guard: reject reserved words as faxIds to prevent route shadowing
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

// POST /fax/:faxId/retry
router.post('/:faxId/retry', rejectReservedFaxId, retryFaxController);

module.exports = router;
