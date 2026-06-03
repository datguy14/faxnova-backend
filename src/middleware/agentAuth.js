const jwt = require("jsonwebtoken");

module.exports = function agentAuth(req, res, next) {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({
        error: "Missing API key",
        code: "NO_API_KEY"
      });
    }

    // Verify signature + decode payload
    const decoded = jwt.verify(apiKey, process.env.AGENT_API_KEY);

    // Validate payload shape
    if (
      !decoded ||
      typeof decoded !== "object" ||
      !decoded.id ||
      typeof decoded.id !== "string" ||
      !decoded.name ||
      typeof decoded.name !== "string"
    ) {
      return res.status(403).json({
        error: "Invalid API key payload",
        code: "INVALID_PAYLOAD"
      });
    }

    // Attach sanitized agent object
    req.agent = {
      id: decoded.id,
      name: decoded.name,
      role: decoded.role || "agent"
    };

    // Optional: tag for rate limiting / logging
    req.agentId = decoded.id;

    return next();
  } catch (err) {
    const isExpired = err.name === "TokenExpiredError";

    return res.status(403).json({
      error: isExpired ? "Expired API key" : "Invalid API key",
      code: isExpired ? "EXPIRED" : "INVALID"
    });
  }
};
