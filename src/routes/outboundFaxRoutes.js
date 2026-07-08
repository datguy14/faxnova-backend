const express = require("express");
const router = express.Router();

const outboundFaxController = require("../controllers/outboundFaxController");

router.post("/send", outboundFaxController.sendFax);

module.exports = router;
