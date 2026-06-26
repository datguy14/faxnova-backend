module.exports = function residencyGuard(requiredZones = null) {
  return (req, res, next) => {
    const countryHeader = req.headers["x-country"];
    const userCountry = req.user?.country;
    const ipCountry = req.ip;

    const zone = countryHeader || userCountry || ipCountry || "unknown";
    req.residencyZone = zone;

    if (!requiredZones) return next();

    if (!requiredZones.includes(zone)) {
      return res.status(403).json({
        error: "Access denied: residency zone not permitted",
        zone
      });
    }

    next();
  };
};
