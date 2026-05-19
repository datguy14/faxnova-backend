// src/routes/faxResendRoutes.js

const express = require('express');
const router = express.Router();
const { resendFaxController } = require('../controllers/faxResendController');

router.post('/:faxId/resend', resendFaxController);

module.exports = router;
