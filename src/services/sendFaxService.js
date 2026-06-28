// src/services/sendFaxService.js

const FaxNovaError = require("../errors/FaxNovaError");
const OutboundFax = require("../models/OutboundFax");
const { routeAndSendFax } = require("./routingService.v2");
const audit = require("../audit/auditService");

/**
 * Send Fax Service (FaxNova v1)
 *
 * Responsibilities:
 * - Validate payload
 * - Call Routing Service v2
 * - Persist OutboundFax record
 * - Audit log send event
 */

async function sendFax({ tenantId, to, from, pages, documentUrl, tier }) {
  try {
    if (!tenantId) {
      throw new FaxNovaError("Missing tenantId", {
        code: "TENANT_ID_MISSING"
      });
    }

    if (!to || !from || !documentUrl) {
      throw new FaxNovaError("Missing fax fields", {
        code: "FAX_FIELDS_MISSING",
        details: { to, from, documentUrl }
      });
    }

    // ---------------------------------------------
    // 1. Route + Send via RoutingService.v2
    // ---------------------------------------------
    const routingResult = await routeAndSendFax({
      tenantId,
      to,
      from,
      pages,
      documentUrl,
      tier
    });

    const {
      provider,
      jobId,
      residencyZone,
      sovereignty,
      latencyMs,
      routingScore
    } = routingResult;

    // ---------------------------------------------
    // 2. Persist OutboundFax record
    // ---------------------------------------------
    const outboundFax = await OutboundFax.create({
      tenantId,
      provider,
      failoverProvider: null,
      to,
      from,
      pages,
      documentUrl,
      residencyZone,
      sovereignty,
      tier,
      jobId,
      status: "sending",
      latencyMs,
      routingScore
    });

    // ---------------------------------------------
    // 3. Audit log
    // ---------------------------------------------
    audit.logEvent({
      tenantId,
      type: "fax_outbound",
      action: "created",
      details: {
        faxId: outboundFax._id,
        provider,
        jobId,
        residencyZone,
        sovereignty,
        tier,
        latencyMs,
        routingScore
      }
    });

    // ---------------------------------------------
    // 4. Return result
    // ---------------------------------------------
    return {
      faxId: outboundFax._id,
      provider,
      jobId,
      residencyZone,
      sovereignty,
      tier,
      latencyMs,
      routingScore
    };
  } catch (err) {
    throw new FaxNovaError("SendFaxService failed", {
      code: "SEND_FAX_FAILED",
      details: err.message
    });
  }
}

module.exports = {
  sendFax
};
