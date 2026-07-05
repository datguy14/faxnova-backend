// src/guards/residencyGuard.js

const ResidencyError = require("../errors/ResidencyError");
const policy = require("../residency/policy");

/**
 * Residency Guard — Strict‑Mode Edition
 *
 * Ensures outbound and inbound fax operations comply with region residency rules.
 * Controllers call this before sending or storing faxes.
 */

exports.ensureOutboundRegion = (region) => {
  if (!policy.canSend(region)) {
    throw new ResidencyError(`Outbound fax region not allowed: ${region}`);
  }
};

exports.ensureInboundRegion = (region) => {
  if (!policy.canReceive(region)) {
    throw new ResidencyError(`Inbound fax region not allowed: ${region}`);
  }
};
