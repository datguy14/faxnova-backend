const jwt = require("jsonwebtoken");

module.exports = function agentAuth(req, res, next) {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({ error: "Missing API key" });
    }

    // Verify + decode
    const decoded = jwt.verify(apiKey, process.env.AGENT_API_KEY);

    // Basic payload hardening
    if (!decoded || !decoded.id || !decoded.name) {
      return res.status(403).json({ error: "Invalid API key payload" });
    }

    // Attach a clean agent object
    req.agent = {
      id: decoded.id,
      name: decoded.name,
      role: decoded.role || "agent"
    };

    // Optional: tag requests for logging / rate limiting
    req.agentId = decoded.id;

    return next();
  } catch (err) {
    const isExpired = err.name === "TokenExpiredError";
    return res.status(403).json({
      error: isExpired ? "Expired API key" : "Invalid API key"
    });
  }
};
