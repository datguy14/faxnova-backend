// src/routes/authRoutes.js

const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

router.post("/admin/register", authController.registerAdmin);
router.post("/admin/login", authController.loginAdmin);

module.exports = router;
