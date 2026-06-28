// src/services/sendFaxService.js

const FaxNovaError = require("../errors/FaxNovaError");
const OutboundFax = require("../models/OutboundFax");
const { routeAndSendFax } = require("./routingService.v2");
const audit = require("../audit/auditService");

async function sendFax({ tenantId, to, from, pages, documentUrl, tier }) {
  try {
    if (!tenantId || !to || !from || !documentUrl) {
      throw new FaxNovaError("Missing required fax fields", {
        code: "FAX_FIELDS_MISSING"
      });
    }

    // 1. Route + Send via Routing Engine v2
    const result = await routeAndSendFax({
      tenantId,
      to,
      from,
      pages,
      documentUrl,
      tier
    });

    const fax = await OutboundFax.create({
      tenantId,
      provider: result.provider,
      failoverProvider: null,
      to,
      from,
      pages,
      documentUrl,
      residencyZone: result.residencyZone,
      sovereignty: result.sovereignty,
      tier,
      jobId: result.jobId,
      status: "sending",
      latencyMs: result.latencyMs,
      routingScore: result.routingScore
    });

    // 3. Audit
    audit.logEvent({
      tenantId,
      type: "fax_outbound",
      action: "created",
      details: {
        faxId: fax._id,
        provider: result.provider,
        jobId: result.jobId,
        residencyZone: result.residencyZone,
        sovereignty: result.sovereignty,
        tier,
        latencyMs: result.latencyMs,
        routingScore: result.routingScore
      }
    });

    return {
      faxId: fax._id,
      ...result
    };
  } catch (err) {
    throw new FaxNovaError("SendFaxService failed", {
      code: "SEND_FAX_FAILED",
      details: err.message
    });
  }
}

module.exports = { sendFax };
