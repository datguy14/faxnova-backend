// src/routes/faxRoutes.js

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

/**
 * Selects the correct rate limiter based on API key tier.
 * req.apiTier is set by getTierFromApiKey middleware.
 */
function tierLimiter(free, pro, biz) {
  return (req, res, next) => {
    const tier = req.apiTier || 'free';

    if (tier === 'pro') return pro(req, res, next);
    if (tier === 'business') return biz(req, res, next);

    return free(req, res, next); // default to free tier
  };
}

/* -------------------------------------------------------
   SEND FAX - Now supports multi-provider via ?provider= or body.provider
------------------------------------------------------- */

router.post(
  '/send',
  tierLimiter(freeSendFax, proSendFax, bizSendFax),
  tierLimiter(freeSendFaxHourly, proSendFaxHourly, bizSendFaxHourly),
  faxController.sendFax
);

/* -------------------------------------------------------
   GET FAX STATUS
------------------------------------------------------- */

router.get(
  '/status/:id',
  tierLimiter(freeStatus, proStatus, bizStatus),
  faxController.getFaxStatus
);

/* -------------------------------------------------------
   NEW: List Available Providers (useful for dashboard/clients)
------------------------------------------------------- */

router.get('/providers', (req, res) => {
  const faxRouter = require('../integrations/faxRouter');
  
  res.json({
    success: true,
    defaultProvider: process.env.DEFAULT_FAX_PROVIDER || 'sinch',
    availableProviders: faxRouter.getAvailableProviders(),
    fallbackEnabled: process.env.ENABLE_PROVIDER_FALLBACK === 'true'
  });
});

module.exports = router;
