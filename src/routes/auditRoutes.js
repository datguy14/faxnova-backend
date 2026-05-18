// src/routes/auditRoutes.js

const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');

/**
 * Protect this route with an admin API key.
 */
router.get('/logs', (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];

  if (!adminKey || adminKey !== process.env.ADMIN_AUDIT_KEY) {
    return res.status(403).json({
      success: false,
      error: "Forbidden: Admin key required."
    });
  }

  next();
}, auditController.getAuditLogs);

module.exports = router;
