// src/services/residencyEngine.js

/**
 * Residency Engine v1
 *
 * Responsibilities:
 * - Map phone numbers to residency zones (us, eu, apac, latam, ca)
 * - Map zones to sovereignty labels
 *
 * This is intentionally simple and deterministic for FaxNova v1.
 */

const ZONES = {
  us: {
    sovereignty: "us",
    countries: ["US", "PR"]
  },
  ca: {
    sovereignty: "ca",
    countries: ["CA"]
  },
  eu: {
    sovereignty: "eu",
    countries: [
      "GB",
      "DE",
      "FR",
      "ES",
      "IT",
      "NL",
      "SE",
      "NO",
      "DK",
      "FI",
      "IE",
      "BE",
      "AT",
      "PT",
      "PL"
    ]
  },
  apac: {
    sovereignty: "apac",
    countries: ["AU", "NZ", "JP", "SG", "HK"]
  },
  latam: {
    sovereignty: "latam",
    countries: ["MX", "BR", "AR", "CL", "CO", "PE"]
  }
};

/**
 * Very simple E.164 country detection:
 * - +1 → US/CA (we treat non‑CA as US)
 * - +44 → GB (EU)
 * - +33 → FR (EU)
 * - +49 → DE (EU)
 * - +61 → AU (APAC)
 * - +81 → JP (APAC)
 * - +55 → BR (LATAM)
 * - +52 → MX (LATAM)
 *
 * For FaxNova v1 this is enough; later you can swap in a full library.
 */
function detectCountryFromNumber(number) {
  if (!number) return null;

  const n = number.replace(/\s+/g, "");

  if (n.startsWith("+1")) {
    // crude split: assume CA if explicitly flagged later; default US
    return "US";
  }
  if (n.startsWith("+44")) return "GB";
  if (n.startsWith("+33")) return "FR";
  if (n.startsWith("+49")) return "DE";
  if (n.startsWith("+61")) return "AU";
  if (n.startsWith("+81")) return "JP";
  if (n.startsWith("+55")) return "BR";
  if (n.startsWith("+52")) return "MX";

  return null;
}

function zoneForCountry(country) {
  if (!country) return "us"; // safe default

  for (const [zone, cfg] of Object.entries(ZONES)) {
    if (cfg.countries.includes(country)) return zone;
  }

  return "us"; // fallback
}

module.exports = {
  /**
   * Detect residency zone from a phone number.
   *
   * Returns one of: "us", "ca", "eu", "apac", "latam"
   */
  detectZone(number) {
    const country = detectCountryFromNumber(number);
    return zoneForCountry(country);
  },

  /**
   * Get sovereignty label from residency zone.
   *
   * Example:
   *  - "us"   → "us"
   *  - "eu"   → "eu"
   *  - "apac" → "apac"
   */
  getSovereignty(zone) {
    const cfg = ZONES[zone];
    if (!cfg) return "us";
    return cfg.sovereignty;
  }
};
