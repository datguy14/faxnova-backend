const Tenant = require("../models/Tenant");

module.exports = async function apiKeyGuard(req, res, next) {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({ error: "Missing API key" });
    }

    const tenant = await Tenant.findOne({ apiKey });
    if (!tenant) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    req.tenantId = tenant._id.toString();
    req.tenant = tenant;

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
