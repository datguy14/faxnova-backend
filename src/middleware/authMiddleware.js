const jwt = require("jsonwebtoken");
const FaxNovaError = require("../errors/FaxNovaError");

// API keys for internal services (workers, webhooks, admin tools)
const VALID_API_KEYS = new Set([
  process.env.INTERNAL_API_KEY,
  process.env.WORKER_API_KEY,
  process.env.WEBHOOK_API_KEY
]);

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers["x-api-key"];

    // ---------------------------------------------
    // 1. API KEY AUTH (Workers, Webhooks, Internal Services)
    // ---------------------------------------------
    if (apiKeyHeader && VALID_API_KEYS.has(apiKeyHeader)) {
      req.user = {
        id: "internal-service",
        role: "system",
        tenantId: "global"
      };
      req.tenantId = "global";
      return next();
    }

    // ---------------------------------------------
    // 2. JWT AUTH (User / Admin)
    // ---------------------------------------------
    if (!authHeader) {
      throw new FaxNovaError("Missing authentication token", {
        code: "AUTH_TOKEN_MISSING"
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new FaxNovaError("Missing authentication token", {
        code: "AUTH_TOKEN_MISSING"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role
    };

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
