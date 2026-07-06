// src/services/outboundFaxService.js — Strict‑Mode CommonJS Version

const OutboundFax = require("../models/OutboundFax");
const routingService = require("./routingService.v2");

exports.processOutboundFax = async ({ to, storageKey, residencyZone, tier, region }) => {
  // 1. Select provider using routingService.v2
  const { primary } = await routingService.selectProvider({
    residencyZone,
    tier,
    region
  });

  // 2. Create fax record
  const fax = await OutboundFax.create({
    to,
    provider: primary,
    storageKey,
    region
  });

  return fax;
};
