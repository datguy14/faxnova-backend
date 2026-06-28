// src/services/routingService.v2.js

const FaxNovaError = require("../errors/FaxNovaError");
const providerRouter = require("../providers/providerRouter");
const providerScoreCache = require("./providerScoreCache");
const providerPerformanceService = require("./providerPerformanceService");
const providerOutageService = require("./providerOutageService");
const residencyEngine = require("../residency/residencyEngine");

/**
 * Routing Engine v2
 * Unified + failover aware + performance aware + outage aware
 */
async function routeAndSendFax({
  tenantId,
  to,
  from,
  pages,
  documentUrl,
  tier,
  faxId,
  retry = false
}) {
  try {
    if (!tenantId || !to || !from || !documentUrl || !faxId) {
      throw new FaxNovaError("Missing routing fields", {
        code: "ROUTING_FIELDS_MISSING"
      });
    }

    // 1. Residency + sovereignty normalization
    const residency = residencyEngine.resolve(to);
    const residencyZone = residency.zone;
    const sovereignty = residency.sovereignty;

    // 2. Provider scores (cached)
    const scores = await providerScoreCache.getScores();

    // 3. Provider outage states
    const outages = await providerOutageService.getOutageStates();

    // 4. Provider selection (failover aware)
    const provider = providerRouter.selectProvider({
      residencyZone,
      sovereignty,
      scores,
      outages,
      retry
    });

    if (!provider) {
      throw new FaxNovaError("No available provider", {
        code: "NO_PROVIDER_AVAILABLE",
        residencyZone,
        sovereignty
      });
    }

    // 5. Send fax via provider adapter
    const adapter = providerRouter.getAdapter(provider);

    const sendResult = await adapter.sendFax({
      tenantId,
      to,
      from,
      pages,
      documentUrl,
      faxId
    });

    // 6. Track latency + performance
    providerPerformanceService.recordSuccess(provider, sendResult.latencyMs);

    return {
      provider,
      jobId: sendResult.jobId,
      latencyMs: sendResult.latencyMs,
      routingScore: scores[provider] || 0,
      residencyZone,
      sovereignty
    };
  } catch (err) {
    throw new FaxNovaError("RoutingEngineV2 failed", {
      code: "ROUTING_ENGINE_FAILED",
      details: err.message
    });
  }
}

module.exports = { routeAndSendFax };
