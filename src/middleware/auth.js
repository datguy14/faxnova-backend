const jwt = require("jsonwebtoken");
const FaxNovaError = require("../errors/FaxNovaError");

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      throw new FaxNovaError("Missing authentication token", {
        code: "AUTH_TOKEN_MISSING"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user context
    req.user = {
      id: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role
    };

    // Critical fix: attach tenantId directly
    req.tenantId = decoded.tenantId;

    next();
  } catch (err) {
    next(
      new FaxNovaError("Invalid or expired token", {
        code: "AUTH_INVALID",
        details: err.message
      })
    );
  }
};
