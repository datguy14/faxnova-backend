// src/routes/authRoutes.js

const express = require("express");
const router = express.Router();
const { z } = require("zod");

const FaxNovaError = require("../errors/FaxNovaError");
const authController = require("../controllers/authController");

// Zod validation schema
const authSchema = z.object({
  email: z.string()
    .email("Invalid email format")
    .min(5, "Email too short")
    .max(254, "Email too long")
    .transform(e => e.toLowerCase().trim()),

  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(/^\S+$/, "Password cannot contain spaces")
});

// Wrapper to validate input
function validateAuth(req, res, next) {
  try {
    req.body = authSchema.parse(req.body);
    next();
  } catch (err) {
    next(new FaxNovaError(err.errors?.[0]?.message || "Invalid credentials", 400));
  }
}

// Register
router.post("/register", validateAuth, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authController.register(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Login
router.post("/login", validateAuth, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authController.login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
