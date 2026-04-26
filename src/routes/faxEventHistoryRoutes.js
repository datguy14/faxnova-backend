const express = require('express');
const router = express.Router();

const { getFaxEventHistory } = require('../controllers/faxEventHistoryController');

// GET /fax/history/:id
router.get('/history/:id', getFaxEventHistory);

module.exports = router;
