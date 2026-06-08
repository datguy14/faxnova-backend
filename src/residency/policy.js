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
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {string} - Residency zone identifier
 */
export function getResidencyZone(countryCode) {
  if (!countryCode) return "global";
  
  // US tribal territories
  if (countryCode === "US") return "us-east-tribal";
  
  // EU member states (sample)
  if (["DE", "FR", "NL", "IT", "ES", "SE", "PL", "BE", "AT", "DK", "FI", "GR", "IE", "LU", "PT"].includes(countryCode)) {
    return "eu-sovereign";
  }
  
  return "global";
}

/**
 * Check if a provider is allowed in a given residency zone
 * @param {string} zone - Residency zone identifier
 * @param {string} provider - Provider name (sinch, telnyx, etc.)
 * @returns {boolean} - True if provider is allowed in zone
 */
export function isProviderAllowed(zone, provider) {
  const config = RESIDENCY_ZONES[zone];
  if (!config) return true; // Unknown zone defaults to global
  return config.providers.includes(provider);
}

/**
 * Get all providers allowed for a zone
 * @param {string} zone - Residency zone identifier
 * @returns {string[]} - Array of allowed provider names
 */
export function getProvidersForZone(zone) {
  const config = RESIDENCY_ZONES[zone] || RESIDENCY_ZONES["global"];
  return config.providers;
}

/**
 * Get zone configuration
 * @param {string} zone - Residency zone identifier
 * @returns {object|null} - Zone config or null if not found
 */
export function getZoneConfig(zone) {
  return RESIDENCY_ZONES[zone] || null;
}

/**
 * List all available zones
 * @returns {object} - All zone configurations
 */
export function listZones() {
  return RESIDENCY_ZONES;
}
