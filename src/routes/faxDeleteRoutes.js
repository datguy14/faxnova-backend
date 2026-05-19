// src/routes/faxDeleteRoutes.js

const express = require('express');
const router = express.Router();
const { deleteFaxController } = require('../controllers/faxDeleteController');

router.delete('/:faxId', deleteFaxController);

module.exports = router;
