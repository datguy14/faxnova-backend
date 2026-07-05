// src/controllers/authController.js

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const FaxNovaError = require("../errors/FaxNovaError");
const User = require("../models/User");
const Tenant = require("../models/Tenant");

module.exports = {
  async register(email, password) {
    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      throw new FaxNovaError("Email already registered", 400);
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user (assign tenant automatically or later)
    const user = await User.create({
      email,
      password: hashed,
      active: true
    });

    // Load tenant (or assign default)
    const tenant = await Tenant.findById(user.tenantId);
    if (!tenant) {
      throw new FaxNovaError("Tenant not found for user", 400);
    }

    // Correct JWT payload for your middleware
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        tenantId: tenant._id.toString()
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return { success: true, token };
  },

  async login(email, password) {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new FaxNovaError("Invalid credentials", 400);
    }

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new FaxNovaError("Invalid credentials", 400);
    }

    // Load tenant
    const tenant = await Tenant.findById(user.tenantId);
    if (!tenant) {
      throw new FaxNovaError("Tenant not found", 400);
    }

    // Correct JWT payload for your middleware
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        tenantId: tenant._id.toString()
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return { success: true, token };
  }
};
