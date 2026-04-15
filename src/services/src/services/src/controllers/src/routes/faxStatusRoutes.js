const express = require('express');
const router = express.Router();
const { checkFaxStatus } = require('../controllers/faxStatusController');

router.get('/:faxId', checkFaxStatus);

module.exports = router;
