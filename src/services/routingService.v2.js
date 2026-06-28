// src/services/routingService.v2.js

const FaxNovaError = require("../errors/FaxNovaError");
const residencyEngine = require("./residencyEngine");
const providerRouter = require("../providers/providerRouter");
const providerPerformanceService = require("./providerPerformanceService");
const providerOutageService = require("./providerOutageService");

const sinch = require("../providers/sinchAdapter");
const telnyx = require("../providers/telnyxAdapter");

const audit = require("../audit/auditService");

const providerMap = {
  sinch,
  telnyx
};

/**
 * Routing Service v2 (FaxNova v1)
 *
 * Responsibilities:
 * - Resolve residency + sovereignty
 * - Select best provider using Routing Engine v2
 * - Send fax via selected provider
 * - Track latency + performance
 * - Track outages
 * - Audit log routing + send events
 */

async function routeAndSendFax({
  tenantId,
  to,
  from,
  pages,
  documentUrl,
  tier
}) {
  try {
    // ---------------------------------------------
    // 1. Residency Resolution
    // ---------------------------------------------
    const residency = residencyEngine.resolveOutboundResidency({ to });

    const { zone: residencyZone, sovereignty } = residency;

    // ---------------------------------------------
    // 2. Routing Engine v2 → Provider Selection
    // ---------------------------------------------
    const route = await providerRouter.routeProvider({
      residencyZone,
      tier
    });

    const providerName = route.provider;
    const provider = providerMap[providerName];

    if (!provider) {
      throw new FaxNovaError("Invalid provider selected by routing engine", {
        code: "ROUTING_PROVIDER_INVALID",
        provider: providerName
      });
    }

    // ---------------------------------------------
    // 3. Send Fax via Provider
    // ---------------------------------------------
    const start = Date.now();

    let result;
    try {
      result = await provider.sendFax({
        to,
        from,
        pages,
        documentUrl,
        residencyZone,
        tier
      });
    } catch (err) {
      // Track outage
      await providerOutageService.recordFailure(providerName);

      throw new FaxNovaError("Provider sendFax failed", {
        code: "PROVIDER_SEND_FAILED",
        provider: providerName,
        details: err.message
      });
    }

    const latencyMs = Date.now() - start;

    // ---------------------------------------------
    // 4. Track Performance
    // ---------------------------------------------
    providerPerformanceService.recordSuccess(providerName, latencyMs);

    // ---------------------------------------------
    // 5. Audit Log
    // ---------------------------------------------
    audit.logEvent({
      tenantId,
      type: "fax_outbound",
      action: "sent",
      details: {
        provider: providerName,
        jobId: result.jobId,
        residencyZone,
        sovereignty,
        tier,
        latencyMs,
        routingScore: route.score
      }
    });

    // ---------------------------------------------
    // 6. Return Routing + Provider Result
    // ---------------------------------------------
    return {
      provider: providerName,
      jobId: result.jobId,
      residencyZone,
      sovereignty,
      tier,
      latencyMs,
      routingScore: route.score
    };
  } catch (err) {
    throw new FaxNovaError("RoutingService.v2 failed", {
      code: "ROUTING_V2_FAILED",
      details: err.message
    });
  }
}

module.exports = {
  routeAndSendFax
};
