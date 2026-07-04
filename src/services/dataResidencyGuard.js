// src/services/dataResidencyGuard.js

const ResidencyRule = require("../models/ResidencyRule");
const { ForbiddenError } = require("../errors");

module.exports = {
  /**
   * Enforces data‑residency restrictions for outbound fax sending.
   * Called inside outboundFaxService BEFORE provider selection.
   */
  async enforceOutboundResidency({ tenantId, targetRegion }) {
    // Fetch residency rules for this tenant
    const rules = await ResidencyRule.findOne({ tenantId });

    // If no rules exist, allow everything
    if (!rules || !rules.outbound) {
      return { allowed: true };
    }

    // If region is explicitly blocked
    if (rules.outbound.blocked?.includes(targetRegion)) {
      throw new ForbiddenError(
        `Outbound faxing to region '${targetRegion}' is not permitted for this tenant.`
      );
    }

    // If region is explicitly allowed
    if (rules.outbound.allowed?.includes(targetRegion)) {
      return { allowed: true };
    }

    // Default deny if "strict mode" is enabled
    if (rules.outbound.strict === true) {
      throw new ForbiddenError(
        `Outbound faxing to region '${targetRegion}' is restricted by strict residency policy.`
      );
    }

    // Otherwise allow
    return { allowed: true };
  },

  /**
   * Enforces inbound fax residency rules.
   * Called inside inboundFaxService BEFORE storing or processing inbound fax.
   */
  async enforceInboundResidency({ tenantId, sourceRegion }) {
    const rules = await ResidencyRule.findOne({ tenantId });

    if (!rules || !rules.inbound) {
      return { allowed: true };
    }

    if (rules.inbound.blocked?.includes(sourceRegion)) {
      throw new ForbiddenError(
        `Inbound faxing from region '${sourceRegion}' is not permitted for this tenant.`
      );
    }

    if (rules.inbound.allowed?.includes(sourceRegion)) {
      return { allowed: true };
    }

    if (rules.inbound.strict === true) {
      throw new ForbiddenError(
        `Inbound faxing from region '${sourceRegion}' is restricted by strict residency policy.`
      );
    }

    return { allowed: true };
  }
};
