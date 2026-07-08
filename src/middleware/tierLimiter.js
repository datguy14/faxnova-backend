// src/middleware/tierLimiter.js
// Strict‑Mode Tier Enforcement for FaxNova

const rateLimitWindows = {
  free: { max: 10, windowMs: 24 * 60 * 60 * 1000 },     // 10 faxes/day
  basic: { max: 100, windowMs: 24 * 60 * 60 * 1000 },   // 100 faxes/day
  pro: { max: 1000, windowMs: 24 * 60 * 60 * 1000 },    // 1000 faxes/day
  enterprise: { max: Infinity, windowMs: 0 }            // unlimited
};

// In‑memory counters (Redis recommended later)
const counters = {};

module.exports = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user || !user.tier) {
      return res.status(403).json({
        ok: false,
        error: "Missing user tier"
      });
    }

    const tier = user.tier.toLowerCase();
    const config = rateLimitWindows[tier];

    if (!config) {
      return res.status(403).json({
        ok: false,
        error: "Invalid user tier"
      });
    }

    // Enterprise tier bypasses limits
    if (tier === "enterprise") {
      return next();
    }

    const key = `${user.id}:${tier}`;
    const now = Date.now();

    if (!counters[key]) {
      counters[key] = { count: 0, resetTime: now + config.windowMs };
    }

    const bucket = counters[key];

    // Reset window if expired
    if (now > bucket.resetTime) {
      bucket.count = 0;
      bucket.resetTime = now + config.windowMs;
    }

    // Enforce limit
    if (bucket.count >= config.max) {
      return res.status(429).json({
        ok: false,
        error: "Tier limit exceeded",
        tier,
        limit: config.max,
        resetTime: bucket.resetTime
      });
    }

    bucket.count += 1;
    next();
  } catch (err) {
    console.error("❌ Tier limiter failed:", err);

    res.status(500).json({
      ok: false,
      error: "Tier limiter internal error"
    });
  }
};
