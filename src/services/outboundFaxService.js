// src/services/outboundFaxService.js

const OutboundFax = require("../models/OutboundFax");
const routingService = require("./routingService.v2");
const retryFaxService = require("./retryFaxService");

exports.processOutboundFax = async ({ to, storageKey, residencyZone, tier, region }) => {
  const { primary } = await routingService.selectProvider({ residencyZone, tier, region });

  const fax = await OutboundFax.create({
    to,
    provider: primary,
    storageKey,
    region
  });

  // enqueue send job (worker consumes this)
  await retryFaxService.enqueueInitialSend(fax);

  return fax;
};
