const express = require('express');
const router = express.Router();

const {
  freeSendFax,
  freeSendFaxHourly,
  freeStatus,
  proSendFax,
  proSendFaxHourly,
  proStatus,
  bizSendFax,
  bizSendFaxHourly,
  bizStatus
} = require('../middleware/rateLimit');

const faxController = require('../controllers/faxController');

// Helper to pick the right limiter
function tierLimiter(free, pro, biz) {
  return (req, res, next) => {
    const tier = req.apiTier || 'free';
    if (tier === 'pro') return pro(req, res, next);
    if (tier === 'business') return biz(req, res, next);
    return free(req, res, next);
  };
}

// SEND FAX
router.post(
  '/send',
  tierLimiter(freeSendFax, proSendFax, bizSendFax),
  tierLimiter(freeSendFaxHourly, proSendFaxHourly, bizSendFaxHourly),
  faxController.sendFax
);

// STATUS CHECK
router.get(
  '/status/:id',
  tierLimiter(freeStatus, proStatus, bizStatus),
  faxController.getFaxStatus
);

module.exports = router;
