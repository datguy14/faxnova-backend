// src/services/inboundFaxService.js

const FaxNovaError = require("../errors/FaxNovaError");
const InboundFax = require("../models/InboundFax");
const residencyEngine = require("./residencyEngine");

async function processInboundFax({ provider, tenantId, payload }) {
  try {
    if (!provider || !tenantId || !payload) {
      throw new FaxNovaError("Inbound fax missing required fields", {
        code: "INBOUND_FIELDS_MISSING"
      });
    }

    // 1. Normalize inbound fax fields (Sinch + Telnyx unified)
    const { from, to, pages, mediaUrl } = payload;

    if (!from || !to || !mediaUrl) {
      throw new FaxNovaError("Inbound fax payload incomplete", {
        code: "INBOUND_PAYLOAD_INCOMPLETE",
        details: payload
      });
    }

    // 2. Residency + sovereignty resolution
    const residency = residencyEngine.resolveInboundResidency({ from });
    const { zone: residencyZone, sovereignty } = residency;

    // 3. Persist inbound fax record
    const fax = await InboundFax.create({
      tenantId,
      provider,
      from,
      to,
      pages,
      mediaUrl,
      residencyZone,
      sovereignty,
      status: "received"
    });

    // 4. Return normalized + enriched inbound fax result
    return {
      faxId: fax._id,
      provider,
      from,
      to,
      pages,
      mediaUrl,
      residencyZone,
      sovereignty
    };
  } catch (err) {
    throw new FaxNovaError("InboundFaxService failed", {
      code: "INBOUND_SERVICE_FAILED",
      details: err.message
    });
  }
}

module.exports = { processInboundFax };
