// src/middleware/getTierFromApiKey.js

/**
 * Determines the API tier based on the provided API key.
 * 
 * Expected tiers:
 * - free
 * - pro
 * - business
 * 
 * You can later replace the hardcoded map with a database lookup.
 */

const apiKeyTiers = {
  // Free tier keys
  "FREE_123": "free",

  // Pro tier keys
  "PRO_123": "pro",

  // Business tier keys
  "BIZ_123": "business"
};

module.exports = function getTierFromApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: "Missing API key."
    });
  }

  const tier = apiKeyTiers[apiKey];

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
