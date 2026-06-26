// src/middleware/residencyGuard.js
module.exports = function residencyGuard(requireZones) {
  return (req, res, next) => {
    const zone = req.headers["x-country"] || "unknown";

    if (requireZones && !requireZones.includes(zone)) {
      return res.status(403).json({ error: "Access not allowed from this region" });
    }

    req.residencyZone = zone;
    next();
  };
};
