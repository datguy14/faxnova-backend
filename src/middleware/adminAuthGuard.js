const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

module.exports = function adminAuthGuard(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: "Missing admin token" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.adminId = payload.adminId;
    req.adminRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid admin token" });
  }
};
