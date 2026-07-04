// src/middleware/residencyGuard.js

const ResidencyRule = require("../models/ResidencyRule");

exports.validateInbound = async ({ tenantId, region }) => {
  try {
    const rule = await ResidencyRule.findOne({ tenantId });

    if (!rule) {
      return { allowed: true }; // No rules → allow
    }

    // Block inbound if region is in the deny list
    if (rule.inboundBlockedRegions?.includes(region)) {
      return { allowed: false };
    }

    return { allowed: true };
  } catch (err) {
    return { allowed: false, error: err.message };
  }
};

exports.validateOutbound = async ({ tenantId, region }) => {
  try {
    const rule = await ResidencyRule.findOne({ tenantId });

    if (!rule) {
      return { allowed: true };
    }

    // Block outbound if region is in the deny list
    if (rule.outboundBlockedRegions?.includes(region)) {
      return { allowed: false };
    }

    return { allowed: true };
  } catch (err) {
    return { allowed: false, error: err.message };
  }
};
