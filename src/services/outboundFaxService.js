// src/services/outboundFaxService.js

const FaxNovaError = require("../errors/FaxNovaError");
const routingService = require("./routingService.v2");
const sinch = require("../providers/sinchAdapter");
const telnyx = require("../providers/telnyxAdapter");
const audit = require("../audit/auditService");

// Unified provider map
const providerMap = {
  sinch,
  telnyx
};

/**
 * Send fax using Routing Engine v2
 */
async function sendFax({ tenantId, to, from, pages, documentUrl, residencyZone, tier }) {
  try {
    if (!tenantId) {
      throw new FaxNovaError("Missing tenant context", {
        code: "TENANT_CONTEXT_MISSING"
      });
    }

    // -----------------------------
    // 1. Routing Engine v2 selects provider
    // -----------------------------
    const route = await routingService.selectProvider({
      tenantId,
      residencyZone,
      tier
    });

    const primaryProviderName = route.provider;
    const failoverProviderName = route.failoverProvider;

    const primaryProvider = providerMap[primaryProviderName];
    const failoverProvider = providerMap[failoverProviderName];

    if (!primaryProvider) {
      throw new FaxNovaError("Invalid primary provider", {
        code: "PRIMARY_PROVIDER_INVALID",
        provider: primaryProviderName
      });
    }

    // -----------------------------
    // 2. Attempt primary provider
    // -----------------------------
    const start = Date.now();

    try {
      const result = await primaryProvider.sendFax({
        to,
        from,
        pages,
        documentUrl,
        residencyZone,
        tier
      });

      const latencyMs = Date.now() - start;

      audit.logEvent({
        tenantId,
        type: "outbound_fax",
        action: "sent_primary",
        details: {
          provider: primaryProviderName,
          jobId: result.jobId,
          latencyMs
        }
      });

      return {
        provider: primaryProviderName,
        failoverProvider: null,
        routingScore: route.score,
        jobId: result.jobId,
        latencyMs
      };
    } catch (err) {
      // Primary failed — log it
      audit.logEvent({
        tenantId,
        type: "outbound_fax",
        action: "primary_failed",
        details: {
          provider: primaryProviderName,
          error: err.message
        }
      });

      // -----------------------------
      // 3. Failover provider attempt
      // -----------------------------
      if (!failoverProvider) {
        throw new FaxNovaError("Primary provider failed and no failover available", {
          code: "NO_FAILOVER_AVAILABLE",
          provider: primaryProviderName
        });
      }

      const failoverStart = Date.now();

      try {
        const result = await failoverProvider.sendFax({
          to,
          from,
          pages,
          documentUrl,
          residencyZone,
          tier
        });

        const latencyMs = Date.now() - failoverStart;

        audit.logEvent({
          tenantId,
          type: "outbound_fax",
          action: "sent_failover",
          details: {
            provider: failoverProviderName,
            jobId: result.jobId,
            latencyMs
          }
        });

        return {
          provider: primaryProviderName,
          failoverProvider: failoverProviderName,
          routingScore: route.score,
          jobId: result.jobId,
          latencyMs
        };
      } catch (failoverErr) {
        audit.logEvent({
          tenantId,
          type: "outbound_fax",
          action: "failover_failed",
          details: {
            provider: failoverProviderName,
            error: failoverErr.message
          }
        });

        throw new FaxNovaError("Both primary and failover providers failed", {
          code: "OUTBOUND_SEND_FAILED",
          primaryProvider: primaryProviderName,
          failoverProvider: failoverProviderName,
          details: failoverErr.message
        });
      }
    }
  } catch (err) {
    throw new FaxNovaError("Outbound fax processing failed", {
      code: "OUTBOUND_PROCESSING_FAILED",
      details: err.message
    });
  }
}

module.exports = {
  sendFax
};
