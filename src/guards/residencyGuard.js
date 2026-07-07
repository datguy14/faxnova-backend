// src/guards/residencyGuard.js — Unified Fax Architecture (CommonJS Only)

const ResidencyError = require("../errors/ResidencyError");
const policy = require("../residency/policy");
const auditService = require("../services/auditService");

/**
 * Residency Guard — Unified Edition
 *
 * Enforces region residency rules for inbound + outbound fax operations.
 * Called by:
 * - inboundFaxService
 * - sendFaxService
 * - webhookService (optional)
 */

exports.ensureOutboundRegion = async ({ tenantId, region, faxId = null }) => {
  if (!policy.canSend(region)) {
    await auditService.logEvent({
      tenantId,
      faxId,
      type: "RESIDENCY_CHECK",
      action: "outbound_region_blocked",
      region,
      details: { reason: "Outbound region not allowed" }
    });

    throw new ResidencyError(`Outbound fax region not allowed: ${region}`);
  }

  await auditService.logEvent({
    tenantId,
    faxId,
    type: "RESIDENCY_CHECK",
    action: "outbound_region_allowed",
    region
  });
};

exports.ensureInboundRegion = async ({ tenantId, region, faxId = null }) => {
  if (!policy.canReceive(region)) {
    await auditService.logEvent({
      tenantId,
      faxId,
      type: "RESIDENCY_CHECK",
      action: "inbound_region_blocked",
      region,
      details: { reason: "Inbound region not allowed" }
    });

    throw new ResidencyError(`Inbound fax region not allowed: ${region}`);
  }

  await auditService.logEvent({
    tenantId,
    faxId,
    type: "RESIDENCY_CHECK",
    action: "inbound_region_allowed",
    region
  });
};
