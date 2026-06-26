// src/routes/authRoutes.js

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const AdminUser = require("../models/AdminUser");
const FaxNovaError = require("../errors/FaxNovaError");

const router = express.Router();

router.post("/admin/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await AdminUser.findOne({ email });
    if (!admin) {
      throw new FaxNovaError("Invalid credentials", { code: "INVALID_LOGIN" });
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      throw new FaxNovaError("Invalid credentials", { code: "INVALID_LOGIN" });
    }

    const token = jwt.sign(
      { adminId: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({ token });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
