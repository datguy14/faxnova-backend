// src/residency/policy.js

/**
 * Residency Policy — Strict‑Mode Edition
 *
 * Defines which regions are allowed for outbound and inbound fax operations.
 * Used by residencyGuard.js to enforce data‑sovereignty and provider constraints.
 */

const ResidencyPolicy = {
  allowedOutboundRegions: [
    "us-east",
    "us-west",
    "eu-central"
  ],

  allowedInboundRegions: [
    "us-east",
    "us-west",
    "eu-central"
  ],

  /**
   * Returns true if the region is allowed for outbound fax sending.
   */
  canSend(region) {
    return this.allowedOutboundRegions.includes(region);
  },

  /**
   * Returns true if the region is allowed for inbound fax storage/processing.
   */
  canReceive(region) {
    return this.allowedInboundRegions.includes(region);
  }
};

module.exports = ResidencyPolicy;
