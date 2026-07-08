const jwt = require("jsonwebtoken");
const AdminSession = require("../models/AdminSession");

module.exports = async function adminAuthGuard(req, res, next) {
  try {
    const token = req.headers["x-admin-token"];
    if (!token) {
      return res.status(401).json({ error: "Missing admin token" });
    }

    const session = await AdminSession.findOne({ token });
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: "Invalid or expired admin token" });
    }

    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    req.adminId = decoded.adminId;
    req.adminRole = decoded.role;

    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
};
