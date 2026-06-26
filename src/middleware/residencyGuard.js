// src/middleware/residencyGuard.js

module.exports = function residencyGuard(requiredZones = null) {
  return (req, res, next) => {
    // Determine residency zone
    const countryHeader = req.headers["x-country"];
    const userCountry = req.user?.country;
    const ipCountry = req.ip; // placeholder until GeoIP is added

    const zone = countryHeader || userCountry || ipCountry || "unknown";

    req.residencyZone = zone;

    // If no restrictions, allow
    if (!requiredZones) {
      return next();
    }

    // If restricted, enforce
    if (!requiredZones.includes(zone)) {
      return res.status(403).json({
        error: "Access denied: residency zone not permitted",
        zone
      });
    }

    next();
  };
};
