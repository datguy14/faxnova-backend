// src/services/sendFaxService.js

const FaxNovaError = require("../errors/FaxNovaError");
const OutboundFax = require("../models/OutboundFax");
const { routeAndSendFax } = require("./routingService.v2");
const audit = require("../audit/auditService");
const crypto = require("crypto");

async function sendFax({ tenantId, to, from, pages, documentUrl, tier }) {
  try {
    if (!tenantId || !to || !from || !documentUrl) {
      throw new FaxNovaError("Missing required fax fields", {
        code: "FAX_FIELDS_MISSING"
      });
    }

    // Generate unified FaxNova faxId (NOT Mongo _id)
    const faxId = crypto.randomUUID();

    // 1. Route + Send via Routing Engine v2
    const result = await routeAndSendFax({
      tenantId,
      to,
      from,
      pages,
      documentUrl,
      tier,
      faxId
    });

    // 2. Persist unified outbound fax record
    const fax = await OutboundFax.create({
      faxId,                         // unified FaxNova ID
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
      jobId: result.jobId,           // provider job ID
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
        faxId,
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
      faxId,
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
