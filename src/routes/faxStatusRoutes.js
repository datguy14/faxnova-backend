const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validateFaxId = require('../middleware/validateFaxId');
const { checkFaxStatus } = require('../controllers/faxStatusController');

// GET /fax/status/:faxId — protected
router.get('/:faxId', auth, validateFaxId, checkFaxStatus);

module.exports = router;
