const express = require('express');
const router = express.Router();
const { checkFaxStatus } = require('../controllers/faxStatusController');
const validateFaxId = require('../middleware/validateFaxId');

router.get('/:faxId', validateFaxId, checkFaxStatus);

module.exports = router;
