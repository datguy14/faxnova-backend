// src/services/providerApiService.js — NEW FILE: Pure adapter calls, no circuit breaker
const sinchAdapter = require("../providers/sinchAdapter");
const telnyxAdapter = require("../providers/telnyxAdapter");

async function sendToProvider(fax) {
  const adapter = fax.provider === "sinch" ? sinchAdapter : telnyxAdapter;
  return adapter.sendFax(fax);
}

module.exports = { sendToProvider };
