// src/routes/auditViewerRoutes.js
const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditViewerController');

router.get('/audit/logs', getAuditLogs);

module.exports = router;
