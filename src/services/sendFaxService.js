// src/services/sendFaxService.js

const routingServiceV2 = require("./routingService.v2");
const sinchAdapter = require("../providers/sinchAdapter");
const telnyxAdapter = require("../providers/telnyxAdapter");

const providerPerformanceService = require("./providerPerformanceService");
const providerOutageService = require("./providerOutageService");

const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../utils/auditLogger");

/**
 * Provider adapter selector
 */
function getAdapter(provider) {
  switch (provider) {
    case "sinch":
      return sinchAdapter;
    case "telnyx":
      return telnyxAdapter;
    default:
      throw new FaxNovaError("Unknown provider", {
        code: "UNKNOWN_PROVIDER",
        provider
      });
  }
}

module.exports = {
  /**
   * Send a fax using Routing Engine v2.
   *
   * payload:
   * - residencyZone
   * - tier
   * - to
   * - from
   * - pages
   * - documentUrl
   */
  async sendFax(payload) {
    const { residencyZone, tier, to, from, pages, documentUrl } = payload;

    // -----------------------------
    // 1. Ask routing engine for primary + failover
    // -----------------------------
    const { primary, failover } = await routingServiceV2.selectProvider({
      residencyZone,
      tier
    });

    // -----------------------------
    // 2. Try primary provider
    // -----------------------------
    const startPrimary = Date.now();

    try {
      const adapter = getAdapter(primary.provider);

      const result = await adapter.sendFax({
        to,
        from,
        pages,
        documentUrl
      });

      const latencyMs = Date.now() - startPrimary;

      await providerPerformanceService.recordLatency(primary.provider, latencyMs);
      await providerPerformanceService.recordSuccess(primary.provider);

      audit.log("fax_sent_primary", {
        provider: primary.provider,
        failoverProvider: failover?.provider || null,
        routingScore: primary.score,
        latencyMs
      });

      return {
        provider: primary.provider,
        failoverProvider: failover?.provider || null,
        routingScore: primary.score,
        jobId: result.jobId,
        latencyMs
      };
    } catch (err) {
      await providerPerformanceService.recordFailure(primary.provider);
      await providerOutageService.recordFailure(primary.provider);

      audit.error("fax_primary_failed", {
        provider: primary.provider,
        error: err.message
      });

      // No failover available
      if (!failover) {
        throw new FaxNovaError("Primary provider failed and no failover available", {
          code: "PRIMARY_ONLY_FAILURE",
          provider: primary.provider,
          details: err.message
        });
      }
    }

    // -----------------------------
    // 3. Try failover provider
    // -----------------------------
    const startFailover = Date.now();

    try {
      const adapter = getAdapter(failover.provider);

      const result = await adapter.sendFax({
        to,
        from,
        pages,
        documentUrl
      });

      const latencyMs = Date.now() - startFailover;

      await providerPerformanceService.recordLatency(failover.provider, latencyMs);
      await providerPerformanceService.recordSuccess(failover.provider);

      audit.log("fax_sent_failover", {
        provider: failover.provider,
        failoverFrom: primary.provider,
        routingScore: failover.score,
        latencyMs
      });

      return {
        provider: failover.provider,
        failoverFrom: primary.provider,
        routingScore: failover.score,
        jobId: result.jobId,
        latencyMs
      };
    } catch (err2) {
      await providerPerformanceService.recordFailure(failover.provider);
      await providerOutageService.recordFailure(failover.provider);

      audit.error("fax_failover_failed", {
        provider: failover.provider,
        error: err2.message
      });

      throw new FaxNovaError("Primary and failover providers failed", {
        code: "PRIMARY_AND_FAILOVER_FAILURE",
        primary: primary.provider,
        failover: failover.provider,
        details: err2.message
      });
    }
  }
};
