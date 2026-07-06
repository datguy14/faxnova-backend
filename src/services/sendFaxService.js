// src/services/sendFaxService.js

const OutboundFax = require("../models/OutboundFax");
const providerApiService = require("./providerApiService");

exports.sendFax = async faxId => {
  const fax = await OutboundFax.findById(faxId);
  if (!fax) throw new Error("Fax not found");

  const result = await providerApiService.sendFax(fax);
  return result;
};
