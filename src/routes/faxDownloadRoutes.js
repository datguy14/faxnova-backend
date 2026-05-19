// src/routes/faxDownloadRoutes.js

const express = require('express');
const router = express.Router();
const { downloadFaxController } = require('../controllers/faxDownloadController');

router.get('/:faxId/download', downloadFaxController);

module.exports = router;
