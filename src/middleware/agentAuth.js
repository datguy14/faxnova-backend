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

    // Verify API key using your AGENT_API_KEY secret
    const decoded = jwt.verify(apiKey, process.env.AGENT_API_KEY);

    // Attach decoded agent info to request
    req.agent = decoded;

    return next();
  } catch (err) {
    return res.status(403).json({
      error: "Invalid or expired API key",
      code: "INVALID_API_KEY"
    });
  }
};
