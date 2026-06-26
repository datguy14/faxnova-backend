// src/middleware/residencyGuard.js

const FaxNovaError = require("../errors/FaxNovaError");

/**
 * Residency Guard Middleware
 *
 * Purpose:
 * - Attach residency metadata to the request
 * - Optionally enforce allowed zones (if provided)
 * - Never block unless explicitly configured
 *
 * Usage:
 *   router.post("/fax/send", residencyGuard(["us", "ca"]), controller)
 *   router.get("/fax/:id", residencyGuard(), controller)
 */

module.exports = function residencyGuard(allowedZones = null) {
  return function (req, res, next) {
    try {
      // 1. Determine residency zone from headers or user
      const headerCountry = req.headers["x-country"];
      const userCountry = req.user?.country;
      const ipCountry = req.ipCountry; // optional if using geo-IP middleware

      const country = headerCountry || userCountry || ipCountry || "us";

      // Normalize to lowercase
      const normalized = String(country).toLowerCase();

      // Attach metadata
      req.residencyCountry = normalized;
      req.residencyZone = normalized; // zone === country for v1

      // 2. If no restrictions → allow
      if (!allowedZones || allowedZones.length === 0) {
        return next();
      }

      // 3. Enforce residency restrictions
      if (!allowedZones.includes(normalized)) {
        throw new FaxNovaError("Access blocked by residency policy", {
          code: "RESIDENCY_BLOCK",
          details: {
            allowedZones,
            receivedZone: normalized
          }
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
