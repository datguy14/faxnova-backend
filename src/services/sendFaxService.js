// src/services/sendFaxService.js

const breaker = require("./providerCircuitBreaker");
const providerRoutingEngine = require("./providerRoutingEngine");
const OutboundFax = require("../models/OutboundFax");

async function sendFax(fax) {
  try {
    // Ensure sovereigntyConstraints exist
    fax.sovereigntyConstraints = fax.sovereigntyConstraints || {};

    // Residency‑aware provider selection
    if (!fax.provider) {
      fax.provider = await providerRoutingEngine.selectProviderForFax(fax);
    }

    // Persist fax with residencyZone + decision log
    const outboundFax = await OutboundFax.create(fax);

    // Fire through circuit breaker
    const result = await breaker.fire({
      ...fax,
      _id: outboundFax._id,
    });

    return {
      success: true,
      provider: fax.provider,
      faxId: outboundFax._id,
      result,
    };
  } catch (err) {
    return {
      success: false,
      provider: fax.provider,
      error: err.message || err,
    };
  }
}

module.exports = {
  sendFax,
};
