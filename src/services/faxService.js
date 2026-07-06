// src/services/faxService.js

const OutboundFax = require("../models/OutboundFax");
const FaxEventService = require("./FaxEventService");

exports.attachProviderResult = async ({ faxId, providerFaxId }) => {
  const fax = await OutboundFax.findById(faxId);
  if (!fax) throw new Error("Outbound fax not found");

  fax.providerFaxId = providerFaxId;
  await fax.save();

  await FaxEventService.recordOutbound({
    provider: fax.provider,
    providerFaxId,
    to: fax.to,
    storageKey: fax.storageKey,
    region: fax.region
  });

  return fax;
};
