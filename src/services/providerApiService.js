// src/services/providerApiService.js — STRICT-MODE VERSION
const sinchAdapter = require("../providers/sinchAdapter");
const telnyxAdapter = require("../providers/telnyxAdapter");

/**
 * Unified provider API entrypoint
 * - Pure adapter call
 * - No circuit breaker logic here
 * - No routing logic here
 * - No outage/performance logic here
 *
 * All metrics + routing + failover are handled by:
 * - providerRoutingEngine
 * - providerCircuitBreaker
 * - sendFaxService
 * - retryFaxService
 */
async function sendToProvider(fax) {
  if (!fax || !fax.provider) {
    throw new Error("sendToProvider requires fax.provider");
  }

  const adapter =
    fax.provider === "sinch"
      ? sinchAdapter
      : fax.provider === "telnyx"
      ? telnyxAdapter
      : null;

  if (!adapter) {
    throw new Error(`Unknown provider: ${fax.provider}`);
  }

  return adapter.sendFax({
    faxId: fax.faxId,
    to: fax.to,
    from: fax.from,
    documentUrl: fax.documentUrl,
    region: fax.region || null
  });
}

module.exports = { sendToProvider };
