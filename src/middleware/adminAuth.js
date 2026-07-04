// src/middleware/adminAuth.js

const authMiddleware = require("./authMiddleware");

module.exports = async (req, res, next) => {
  await authMiddleware(req, res, async () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    next();
  });
};
