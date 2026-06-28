// src/controllers/inboundFaxController.js

const FaxNovaError = require("../errors/FaxNovaError");
const inboundFaxService = require("../services/inboundFaxService");
const audit = require("../audit/auditService");

async function inboundFax(req, res) {
  try {
    const provider = req.provider;          // set by inbound adapter middleware
    const payload = req.body;               // normalized inbound fax payload
    const tenantId = req.tenantId;          // resolved by inbound number → tenant mapping

    if (!provider || !tenantId) {
      throw new FaxNovaError("Inbound fax missing provider or tenant context", {
        code: "INBOUND_CONTEXT_MISSING"
      });
    }

    const result = await inboundFaxService.processInboundFax({
      provider,
      tenantId,
      payload
    });

    audit.logEvent({
      tenantId,
      type: "fax_inbound",
      action: "received",
      details: {
        faxId: result.faxId,
        provider,
        from: result.from,
        to: result.to,
        pages: result.pages,
        mediaUrl: result.mediaUrl,
        residencyZone: result.residencyZone,
        sovereignty: result.sovereignty
      }
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    const error = new FaxNovaError("Inbound fax controller failed", {
      code: "INBOUND_CONTROLLER_FAILED",
      details: err.message
    });

    return res.status(400).json({
      success: false,
      error: error.serialize()
    });
  }
}

module.exports = { inboundFax };
