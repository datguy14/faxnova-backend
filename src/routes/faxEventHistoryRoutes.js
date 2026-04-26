const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getFaxEventHistory } = require('../controllers/faxEventHistoryController');

// GET /fax/history/:id — protected
router.get('/history/:id', auth, getFaxEventHistory);

module.exports = router;
