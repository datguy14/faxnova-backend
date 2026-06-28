// src/controllers/outboundFaxController.js

const FaxNovaError = require("../errors/FaxNovaError");
const { sendFax } = require("../services/sendFaxService");

async function outboundFax(req, res) {
  try {
    const tenantId = req.tenantId;
    const { to, from, pages, documentUrl, tier } = req.body;

    if (!tenantId) {
      throw new FaxNovaError("Missing tenant context", {
        code: "TENANT_CONTEXT_MISSING"
      });
    }

    const result = await sendFax({
      tenantId,
      to,
      from,
      pages,
      documentUrl,
      tier
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    const error = new FaxNovaError("Outbound fax failed", {
      code: "OUTBOUND_FAX_FAILED",
      details: err.message
    });

    return res.status(400).json({
      success: false,
      error: error.serialize()
    });
  }
}

module.exports = { outboundFax };
