// src/routes/inboundFaxRoutes.js

const express = require('express');
const router = express.Router();
const { handleInboundFax } = require('../controllers/inboundFaxController');

// Sinch inbound fax webhook
router.post('/inbound', handleInboundFax);

module.exports = router;
