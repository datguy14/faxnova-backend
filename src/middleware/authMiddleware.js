// src/middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Tenant = require("../models/Tenant");

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ success: false, error: "Missing token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user || !user.active) {
      return res.status(401).json({ success: false, error: "Invalid user" });
    }

    const tenant = await Tenant.findById(user.tenantId);
    if (!tenant) {
      return res.status(401).json({ success: false, error: "Invalid tenant" });
    }

    req.user = user;
    req.tenant = tenant;

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
};
