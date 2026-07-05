const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const FaxNovaError = require("../errors/FaxNovaError");
const User = require("../models/User");

module.exports = {
  async register(email, password) {
    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      throw new FaxNovaError("Email already registered", 400);
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      password: hashed,
    });

    // Issue JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return { token };
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

    // Issue JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return { token };
  }
};
