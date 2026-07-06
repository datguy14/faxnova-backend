// src/services/faxService.js — Strict‑Mode CommonJS Version

const OutboundFax = require("../models/OutboundFax");

exports.createOutboundFax = async data => {
  return await OutboundFax.create({
    to: data.to,
    provider: data.provider,
    storageKey: data.storageKey,
    region: data.region
  });
};

exports.getOutboundFaxById = async faxId => {
  return await OutboundFax.findById(faxId);
};

exports.getOutboundFaxByProviderId = async providerFaxId => {
  return await OutboundFax.findOne({ providerFaxId });
};

exports.updateOutboundFaxStatus = async (providerFaxId, status) => {
  return await OutboundFax.updateOne(
    { providerFaxId },
    { status }
  );
};
