// src/routes/faxRoutes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const agentAuth = require('../middleware/agentAuth');
const faxController = require('../controllers/faxController');

// 🔐 1. AUTH FIRST — protects everything below
router.use(agentAuth);

// 2. Then rate limiters (safe behind auth)
const faxSendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) =>
    req.headers['x-forwarded-for']?.split(',')[0] || req.ip,
});

/* ============================================================
   SEND FAX
============================================================ */
router.post('/send', faxSendLimiter, faxController.sendFax);

/* ============================================================
   GET FAX BY ID
============================================================ */
router.get('/:id', faxController.getFaxById);

/* ============================================================
   LIST USER FAXES
============================================================ */
router.get('/', faxController.listFaxes);

/* ============================================================
   RETRY FAX
============================================================ */
router.post('/:id/retry', faxController.retryFax);

/* ============================================================
   DELETE FAX
============================================================ */
router.delete('/:id', faxController.deleteFax);

module.exports = router;
