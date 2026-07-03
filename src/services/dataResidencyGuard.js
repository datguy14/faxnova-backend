/**
 * src/services/dataResidencyGuard.js
 *
 * Data residency validation service (deprecated: moved to providerRoutingEngine).
 * This service is maintained for backward compatibility only.
 *
 * For new code, use providerRoutingEngine.selectProviderForFax() which handles
 * residency via the unified provider stack.
 *
 * @deprecated - Use providerRoutingEngine instead
 */

const FaxNovaError = require("../errors/FaxNovaError");

// Provider-to-region mapping (hardcoded for now)
const PROVIDER_REGIONS = {
  sinch: ["us", "global"],
  telnyx: ["eu", "us", "global"]
};

/**
 * Enforce residency constraints for a fax
 *
 * @param {object} fax - Fax object
 * @param {string} provider - Provider name
 * @returns {boolean} - True if provider is allowed
 * @throws {FaxNovaError} - If provider violates constraints
 *
 * @deprecated - Use providerRoutingEngine instead
 */
function enforceForFax(fax, provider) {
  const constraints = fax.sovereigntyConstraints || {};
  const requiredRegion = constraints.region || "global";

  const allowedRegions = PROVIDER_REGIONS[provider] || [];
  const allowed = allowedRegions.includes(requiredRegion) || allowedRegions.includes("global");

  if (!allowed) {
    throw new FaxNovaError(
      `Residency violation: provider ${provider} does not satisfy constraints`,
      {
        code: "RESIDENCY_VIOLATION",
        provider,
        requiredRegion,
        allowedRegions
      }
    );
  }

  return true;
}

/**
 * Build decision log entry for audit trail
 *
 * @param {object} fax - Fax object
 * @param {string} provider - Provider name
 * @returns {object} - Decision log entry
 *
 * @deprecated - Use providerDiagnosticsService instead
 */
function buildDecisionLogEntry(fax, provider) {
  const constraints = fax.sovereigntyConstraints || {};
  const region = (constraints.region || "global").toLowerCase();

  return {
    provider,
    region,
    decidedAt: new Date().toISOString(),
    reason: `Provider ${provider} selected for region ${region}`,
    deprecated: true
  };
}

module.exports = {
  enforceForFax,
  buildDecisionLogEntry
};
