const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Standard JWT authentication
exports.auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// Admin-only protection
exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Optional API key authentication
exports.apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) {
      return res.status(401).json({ error: "Missing API key" });
    }

    const user = await User.findOne({ apiKey });
    if (!user) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("APIKEY AUTH ERROR:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
};
