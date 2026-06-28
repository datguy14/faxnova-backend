// src/services/retryFaxService.js

const FaxNovaError = require("../errors/FaxNovaError");
const OutboundFax = require("../models/OutboundFax");
const providerRouter = require("../providers/providerRouter");
const providerOutageService = require("./providerOutageService");
const sinch = require("../providers/sinchAdapter");
const telnyx = require("../providers/telnyxAdapter");
const audit = require("../audit/auditService");

const providerMap = {
  sinch,
  telnyx
};

/**
 * Retry Fax Service (FaxNova v1)
 *
 * Responsibilities:
 * - Validate fax exists + belongs to tenant
 * - Re-route using Routing Engine v2
 * - Attempt retry with new provider
 * - Track provider outages
 * - Update fax record
 * - Audit log retry event
 */

async function retryFax({ tenantId, faxId }) {
  try {
    // -----------------------------
    // 1. Load fax record
    // -----------------------------
    const fax = await OutboundFax.findOne({ _id: faxId, tenantId });

    if (!fax) {
      throw new FaxNovaError("Fax not found for retry", {
        code: "FAX_NOT_FOUND",
        faxId
      });
    }

    // -----------------------------
    // 2. Routing Engine v2 (fresh route)
    // -----------------------------
    const route = await providerRouter.routeProvider({
      residencyZone: fax.residencyZone,
      tier: fax.tier
    });

    const newProviderName = route.provider;
    const newProvider = providerMap[newProviderName];

    if (!newProvider) {
      throw new FaxNovaError("Invalid provider for retry", {
        code: "RETRY_PROVIDER_INVALID",
        provider: newProviderName
      });
    }

    // -----------------------------
    // 3. Attempt retry
    // -----------------------------
    let jobId;
    const start = Date.now();

    try {
      const result = await newProvider.sendFax({
        to: fax.to,
        from: fax.from,
        pages: fax.pages,
        documentUrl: fax.documentUrl,
        residencyZone: fax.residencyZone,
        tier: fax.tier
      });

      jobId = result.jobId;
    } catch (err) {
      // Track outage for provider
      await providerOutageService.recordFailure(newProviderName);

      throw new FaxNovaError("Retry attempt failed", {
        code: "RETRY_FAILED",
        provider: newProviderName,
        details: err.message
      });
    }

    const latencyMs = Date.now() - start;

    // -----------------------------
    // 4. Update fax record
    // -----------------------------
    fax.provider = newProviderName;
    fax.failoverProvider = null;
    fax.jobId = jobId;
    fax.status = "sending";
    fax.latencyMs = latencyMs;
    fax.routingScore = route.score;
    fax.errorCode = null;
    fax.errorMessage = null;

    await fax.save();

    // -----------------------------
    // 5. Audit log
    // -----------------------------
    audit.logEvent({
      tenantId,
      type: "fax_retry",
      action: "retry_success",
      details: {
        faxId,
        provider: newProviderName,
        jobId,
        latencyMs,
        routingScore: route.score
      }
    });

    return {
      faxId,
      provider: newProviderName,
      jobId,
      latencyMs,
      routingScore: route.score
    };
  } catch (err) {
    throw new FaxNovaError("Fax retry processing failed", {
      code: "FAX_RETRY_FAILED",
      details: err.message
    });
  }
}

module.exports = {
  retryFax
};
