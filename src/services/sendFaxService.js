// src/services/sendFaxService.js — FIXED: No circuit breaker import
const providerRoutingEngine = require("./providerRoutingEngine");
const OutboundFax = require("../models/OutboundFax");

async function sendFax(fax) {
  if (!fax.provider) {
    fax.provider = await providerRoutingEngine.selectProviderForFax(fax);
  }
  const outboundFax = await OutboundFax.create(fax);
  return { success: true, faxId: outboundFax._id, provider: fax.provider };
}

module.exports = { sendFax };
