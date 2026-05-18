// src/middleware/getTierFromApiKey.js

/**
 * Maps API keys to service tiers.
 * 
 * Replace this with a database lookup later.
 */
const API_KEY_MAP = {
  // Free tier
  "FREE_123": "free",

  // Pro tier
  "PRO_123": "pro",

  // Business / Enterprise tier
  "BIZ_123": "business"
};

module.exports = function getTierFromApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  // Missing API key
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: "Missing API key. Provide an 'x-api-key' header."
    });
  }

  // Normalize key (trim whitespace)
  const normalizedKey = apiKey.trim();

  // Lookup tier
  const tier = API_KEY_MAP[normalizedKey];

  // Invalid API key
  if (!tier) {
    return res.status(403).json({
      success: false,
      error: "Invalid API key."
    });
  }

  // Attach tier to request for downstream middleware
  req.apiTier = tier;

  next();
};
