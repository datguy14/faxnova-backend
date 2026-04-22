const express = require('express');
const router = express.Router();

const faxEventHistoryController = require('../controllers/faxEventHistoryController');

// GET /fax/history/:id
router.get('/history/:id', faxEventHistoryController.getEventHistory);

module.exports = router;
