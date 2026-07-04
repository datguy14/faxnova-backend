// src/middleware/apiKeyAuth.js

const ApiKey = require("../models/ApiKey");
const Tenant = require("../models/Tenant");

module.exports = async (req, res, next) => {
  try {
    const key = req.headers["x-api-key"];

    if (!key) {
      return res.status(401).json({ success: false, error: "Missing API key" });
    }

    const apiKey = await ApiKey.findOne({ key, active: true });
    if (!apiKey) {
      return res.status(401).json({ success: false, error: "Invalid API key" });
    }

    const tenant = await Tenant.findById(apiKey.tenantId);
    if (!tenant) {
      return res.status(401).json({ success: false, error: "Invalid tenant" });
    }

    req.apiKey = apiKey;
    req.tenant = tenant;

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
};
