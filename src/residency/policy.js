/**
 * Residency Policy Engine
 * Defines zones and provider constraints based on data sovereignty requirements
 */

const RESIDENCY_ZONES = {
  "us-east-tribal": {
    regions: ["US"],
    description: "US Tribal data - US-only providers",
    providers: ["sinch", "telnyx"]
  },
  "eu-sovereign": {
    regions: ["EU"],
    description: "EU GDPR-compliant - EU providers only",
    providers: ["telnyx"]
  },
  "global": {
    regions: ["*"],
    description: "Global non-restricted data",
    providers: ["sinch", "telnyx"]
  }
};

/**
 * Map a country code to a residency zone
 */
function getResidencyZone(countryCode) {
  if (!countryCode) return "global";

  if (countryCode === "US") return "us-east-tribal";

  if (
    [
      "DE", "FR", "NL", "IT", "ES", "SE", "PL", "BE", "AT",
      "DK", "FI", "GR", "IE", "LU", "PT"
    ].includes(countryCode)
  ) {
    return "eu-sovereign";
  }

  return "global";
}

/**
 * Check if a provider is allowed in a given residency zone
 */
function isProviderAllowed(zone, provider) {
  const config = RESIDENCY_ZONES[zone];
  if (!config) return true;
  return config.providers.includes(provider);
}

/**
 * Get all providers allowed for a zone
 */
function getProvidersForZone(zone) {
  const config = RESIDENCY_ZONES[zone] || RESIDENCY_ZONES["global"];
  return config.providers;
}

/**
 * Get zone configuration
 */
function getZoneConfig(zone) {
  return RESIDENCY_ZONES[zone] || null;
}

/**
 * List all available zones
 */
function listZones() {
  return RESIDENCY_ZONES;
}

module.exports = {
  getResidencyZone,
  isProviderAllowed,
  getProvidersForZone,
  getZoneConfig,
  listZones
};
