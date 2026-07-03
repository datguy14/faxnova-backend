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
 * Process:
 * 1. Validate fax record exists
 * 2. Select provider using unified routing engine (health + outage + performance + latency)
 * 3. Update fax status to "sending"
 * 4. Execute send via provider adapter
 * 5. Record latency metrics via providerLatencyTracker
 * 6. Apply success boost to performance and outage services
 * 7. Evaluate overall provider health
 * 8. Update fax with provider message ID
 *
 * @param {string} faxId - Unique fax identifier
 * @returns {Promise<object>} - Provider response { messageId, raw }
 * @throws {FaxNovaError} - If provider selection or send fails
 */
async function sendFax(faxId) {
  try {
    // Validate fax exists
    const fax = await OutboundFax.findOne({ faxId });
    if (!fax) {
      throw new FaxNovaError("Fax not found", {
        code: "FAX_NOT_FOUND",
        details: { faxId }
      });
    }

    // Select best provider using unified routing engine
    const provider = await providerRoutingEngine.selectProviderForFax(fax);

    // Update fax with selected provider and status
    await OutboundFax.updateOne(
      { faxId },
      { provider, status: "sending" }
    );

    // Get adapter for selected provider
    const adapter = provider === "sinch" ? sinchAdapter : telnyxAdapter;

    // Execute send with timing
    const startTime = Date.now();
    const result = await adapter.sendFax({
      faxId,
      to: fax.toNumber,
      from: fax.fromNumber,
      documentUrl: fax.documentUrl
    });
    const latency = Date.now() - startTime;

    // Record success metrics in parallel
    await Promise.all([
      providerLatencyTracker.recordLatency(provider, latency),
      providerPerformanceService.applySuccessBoost(provider),
      providerOutageService.recordSuccess(provider),
      providerHealthService.evaluate(provider)
    ]);

    // Update fax with provider message ID
    await OutboundFax.updateOne(
      { faxId },
      { providerMessageId: result.messageId }
    );

    return result;

  } catch (err) {
    // Extract provider from error context or previous fax state
    let provider = null;
    try {
      const fax = await OutboundFax.findOne({ faxId });
      provider = fax?.provider;
    } catch (lookupErr) {
      // Silently fail - don't double-throw
    }

    // Record failure metrics if provider is known
    if (provider) {
      await Promise.all([
        providerPerformanceService.applyFailurePenalty(provider),
        providerOutageService.recordFailure(provider),
        providerHealthService.evaluate(provider)
      ]).catch(metricsErr => {
        console.error(`[sendFaxService] Metrics update failed for ${provider}:`, metricsErr);
      });
    }

    // Update fax with error details
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

    // Re-throw with normalized error structure
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
