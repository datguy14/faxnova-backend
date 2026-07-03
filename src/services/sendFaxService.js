/**
 * src/services/sendFaxService.js
 *
 * Core service for sending faxes through the unified provider stack.
 * Integrates with providerRoutingEngine for smart provider selection and
 * records all metrics (latency, performance, outage, health) automatically.
 *
 * All provider operations are tracked for diagnostics and failover decisions.
 */

const OutboundFax = require("../models/OutboundFax");
const providerRoutingEngine = require("./providerRoutingEngine");
const providerOutageService = require("./providerOutageService");
const providerPerformanceService = require("./providerPerformanceService");
const providerHealthService = require("./providerHealthService");
const providerLatencyTracker = require("./providerLatencyTracker");
const FaxNovaError = require("../errors/FaxNovaError");

const sinchAdapter = require("../providers/sinchAdapter");
const telnyxAdapter = require("../providers/telnyxAdapter");

/**
 * Send a fax through the best available provider
 *
 * @param {string} faxId - Unique fax identifier
 * @returns {Promise<object>} - Provider response { messageId, raw }
 * @throws {FaxNovaError} - If provider selection or send fails
 */
async function sendFax(faxId) {
  try {
    const fax = await OutboundFax.findOne({ faxId });
    if (!fax) {
      throw new FaxNovaError("Fax not found", {
        code: "FAX_NOT_FOUND",
        details: { faxId }
      });
    }

    // Region-aware routing (if region/residency is present on fax)
    const routingContext = {
      faxId,
      region: fax.region || fax.residencyZone || null
    };

    const provider = await providerRoutingEngine.selectProviderForFax(routingContext);

    await OutboundFax.updateOne(
      { faxId },
      { provider, status: "sending" }
    );

    const adapter = provider === "sinch" ? sinchAdapter : telnyxAdapter;

    const startTime = Date.now();
    const result = await adapter.sendFax({
      faxId,
      to: fax.toNumber,
      from: fax.fromNumber,
      documentUrl: fax.documentUrl
    });
    const latency = Date.now() - startTime;

    await Promise.all([
      providerLatencyTracker.recordLatency(provider, latency),
      providerPerformanceService.recordSuccess(provider),
      providerOutageService.recordSuccess(provider),
      providerHealthService.evaluate(provider)
    ]);

    await OutboundFax.updateOne(
      { faxId },
      { providerMessageId: result.messageId, status: "sent" }
    );

    return result;
  } catch (err) {
    let provider = null;
    try {
      const fax = await OutboundFax.findOne({ faxId });
      provider = fax?.provider || null;
    } catch (_) {
      // ignore lookup error
    }

    if (provider) {
      await Promise.all([
        providerPerformanceService.recordFailure(provider),
        providerOutageService.recordFailure(provider),
        providerHealthService.evaluate(provider)
      ]).catch(metricsErr => {
        console.error(`[sendFaxService] Metrics update failed for ${provider}:`, metricsErr);
      });
    }

    await OutboundFax.updateOne(
      { faxId },
      {
        status: "failed",
        errorCode: err.code || "SEND_FAILED",
        errorMessage: err.message
      }
    ).catch(updateErr => {
      console.error(`[sendFaxService] Failed to update fax ${faxId}:`, updateErr);
    });

    throw new FaxNovaError("Failed to send fax", {
      code: "FAX_SEND_FAILED",
      provider,
      details: {
        originalCode: err.code,
        message: err.message
      }
    });
  }
}

module.exports = { sendFax };
