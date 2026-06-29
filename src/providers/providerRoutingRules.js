// src/providers/providerRoutingRules.js

/**
 * Residency → provider preference map
 * Sovereignty-aware ordering
 */

const residencyPreference = {
  us: ["sinch", "telnyx"],
  eu: ["telnyx", "sinch"],
  global: ["telnyx", "sinch"]
};

/**
 * Get provider order based on residency + sovereignty
 */
function getProviderOrder(residencyZone, sovereignty) {
  // Sovereignty overrides residency if needed
  if (sovereignty === "eu") return residencyPreference.eu;
  if (sovereignty === "us") return residencyPreference.us;

  return residencyPreference[residencyZone] || residencyPreference.global;
}

module.exports = {
  getProviderOrder
};
