// src/middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Tenant = require("../models/Tenant");
const FaxNovaError = require("../errors/FaxNovaError");

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      return next(new FaxNovaError("Missing authorization header", 401));
    }

    const token = header.replace("Bearer ", "").trim();
    if (!token) {
      return next(new FaxNovaError("Missing token", 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(new FaxNovaError("Invalid or expired token", 401));
    }

    // Expecting { userId, tenantId } inside JWT
    const { userId, tenantId } = decoded;

    if (!userId) {
      return next(new FaxNovaError("Malformed token payload", 401));
    }

    const user = await User.findById(userId);
    if (!user || user.active === false) {
      return next(new FaxNovaError("Invalid or inactive user", 401));
    }

    const tenant = await Tenant.findById(tenantId || user.tenantId);
    if (!tenant) {
      return next(new FaxNovaError("Tenant not found", 401));
    }

    req.user = user;
    req.tenant = tenant;

    next();
  } catch (err) {
    next(new FaxNovaError("Unauthorized", 401));
  }
};
