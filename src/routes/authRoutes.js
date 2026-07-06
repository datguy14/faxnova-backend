// src/routes/authRoutes.js — Strict‑Mode CommonJS Version

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET;

router.post("/admin/login", express.json(), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Look up admin user
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // Validate password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    // Issue admin token
    const token = jwt.sign(
      { role: user.role, userId: user._id },
      JWT_ADMIN_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
