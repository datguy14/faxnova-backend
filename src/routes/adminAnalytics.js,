// src/routes/adminAnalyticsRoutes.js

const express = require('express');
const router = express.Router();
const adminAnalyticsController = require('../controllers/adminAnalyticsController');

// Admin-only analytics
router.get('/dashboard', adminAnalyticsController.getAdminAnalytics);

module.exports = router;
