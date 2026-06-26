// src/routes/providerRoutes.js
const express = require("express");
const router = express.Router();

const providerController = require("../controllers/providerController");

router.get("/outbound", providerController.list);

module.exports = router;
