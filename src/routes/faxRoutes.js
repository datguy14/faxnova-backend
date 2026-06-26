// src/routes/faxRoutes.js
const express = require("express");
const router = express.Router();

const faxController = require("../controllers/faxController");

router.post("/outbound", faxController.createOutbound);
router.get("/:id", faxController.getById);

module.exports = router;
