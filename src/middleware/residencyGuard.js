/**
 * Residency Guard Middleware
 * Detects and enforces data residency zones on incoming requests
 */

import { getResidencyZone } from "../residency/policy.js";

/**
 * Express middleware to attach residency zone to request
 * Reads country from x-country header (TODO: implement real geolocation)
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next
 */
export function residencyGuard(req, res, next) {
  try {
    // Priority: explicit header > user profile > geolocation > default
    const country = 
      req.header("x-country") ||
      req.user?.country ||
      req.ip; // TODO: implement GeoIP lookup
    
    const zone = getResidencyZone(country);
    
    // Attach to request for downstream use
    req.residencyZone = zone;
    req.residencyCountry = country;
    
    // Log for audit trail
    if (process.env.DEBUG_RESIDENCY === "true") {
      console.log(`[Residency] Country: ${country} -> Zone: ${zone}`);
    }
    
    next();
  } catch (error) {
    console.error("[Residency Guard] Error:", error.message);
    res.status(500).json({ error: "Residency detection failed" });
  }
}

/**
 * Optional: Enforce a specific zone requirement
 * @param {string} allowedZone - The zone that must match
 * @returns {function} - Middleware function
 */
export function requireZone(allowedZone) {
  return (req, res, next) => {
    if (req.residencyZone !== allowedZone) {
      return res.status(403).json({
        error: `Access denied. This endpoint requires ${allowedZone} zone, but request is in ${req.residencyZone} zone.`
      });
    }
    next();
  };
}

/**
 * Optional: Enforce multiple allowed zones
 * @param {string[]} allowedZones - Array of allowed zones
 * @returns {function} - Middleware function
 */
export function requireZones(...allowedZones) {
  return (req, res, next) => {
    if (!allowedZones.includes(req.residencyZone)) {
      return res.status(403).json({
        error: `Access denied. Allowed zones: ${allowedZones.join(", ")}. Current zone: ${req.residencyZone}.`
      });
    }
    next();
  };
}
