// src/services/residencyEngine.js

/**
 * Residency Engine (FaxNova v1)
 *
 * Responsibilities:
 * - Map phone numbers → country → residency zone
 * - Apply sovereignty rules
 * - Normalize inbound + outbound residency metadata
 *
 * Zones:
 * - us
 * - eu
 * - global
 *
 * Sovereignty:
 * - domestic
 * - foreign
 */

const FaxNovaError = require("../errors/FaxNovaError");

// Country → residency zone mapping
const COUNTRY_TO_ZONE = {
  US: "us",
  CA: "global",
  MX: "global",

  // EU countries
  DE: "eu",
  FR: "eu",
  NL: "eu",
  IT: "eu",
  ES: "eu",
  SE: "eu",
  PL: "eu",
  BE: "eu",
  AT: "eu",
  DK: "eu",
  FI: "eu",
  GR: "eu",
  IE: "eu",
  LU: "eu",
  PT: "eu",

  // Everything else
  DEFAULT: "global"
};

/**
 * Extract country code from E.164 number
 */
function extractCountryCode(number) {
  if (!number || typeof number !== "string") return null;

  // Remove + and non-digits
  const cleaned = number.replace(/[^\d]/g, "");

  // Basic E.164 country detection
  if (cleaned.startsWith("1")) return "US"; // NANP
  if (cleaned.startsWith("33")) return "FR";
  if (cleaned.startsWith("49")) return "DE";
  if (cleaned.startsWith("34")) return "ES";
  if (cleaned.startsWith("31")) return "NL";
  if (cleaned.startsWith("39")) return "IT";
  if (cleaned.startsWith("46")) return "SE";
  if (cleaned.startsWith("48")) return "PL";
  if (cleaned.startsWith("32")) return "BE";
  if (cleaned.startsWith("43")) return "AT";
  if (cleaned.startsWith("45")) return "DK";
  if (cleaned.startsWith("358")) return "FI";
  if (cleaned.startsWith("30")) return "GR";
  if (cleaned.startsWith("353")) return "IE";
  if (cleaned.startsWith("352")) return "LU";
  if (cleaned.startsWith("351")) return "PT";

  return null;
}

/**
 * Map country → residency zone
 */
function resolveZoneFromCountry(countryCode) {
  if (!countryCode) return COUNTRY_TO_ZONE.DEFAULT;
  return COUNTRY_TO_ZONE[countryCode] || COUNTRY_TO_ZONE.DEFAULT;
}

/**
 * Resolve sovereignty
 */
function resolveSovereignty(zone) {
  return zone === "us" ? "domestic" : "foreign";
}

/**
 * Outbound residency resolution
 */
function resolveOutboundResidency({ to }) {
  if (!to) {
    throw new FaxNovaError("Missing outbound number", {
      code: "OUTBOUND_RESIDENCY_MISSING"
    });
  }

  const country = extractCountryCode(to);
  const zone = resolveZoneFromCountry(country);
  const sovereignty = resolveSovereignty(zone);

  return {
    zone,
    sovereignty
  };
}

/**
 * Inbound residency resolution
 */
function resolveInboundResidency({ from, residencyZone, sovereignty }) {
  // Provider adapters already supply residencyZone + sovereignty
  if (residencyZone && sovereignty) {
    return {
      zone: residencyZone,
      sovereignty
    };
  }

  // Fallback: detect from inbound caller
  const country = extractCountryCode(from);
  const zone = resolveZoneFromCountry(country);
  const sov = resolveSovereignty(zone);

  return {
    zone,
    sovereignty: sov
  };
}

module.exports = {
  extractCountryCode,
  resolveZoneFromCountry,
  resolveSovereignty,
  resolveOutboundResidency,
  resolveInboundResidency
};
