const InboundFax = require("../models/InboundFax");
const audit = require("../audit/auditService");
const residencyEngine = require("../residency/residencyEngine");
const storageService = require("../storage/storageService");

const inboundFaxService = {
  async processInbound(event) {
    const {
      provider,
      faxId,
      fromNumber,
      toNumber,
      pages,
      mediaUrl,
      timestamp,
      tenantId
    } = normalizeInboundPayload(event);

    // 1. Residency + sovereignty
    const residency = residencyEngine.resolveInbound({
      toNumber,
      provider
    });

    // 2. Store media in correct residency zone
    const storedMedia = await storageService.storeInboundFax({
      mediaUrl,
      faxId,
      residency
    });

    // 3. Create inbound fax record
    const inboundFax = await InboundFax.create({
      provider,
      faxId,
      fromNumber,
      toNumber,
      pages,
      mediaUrl: storedMedia.url,
      residencyZone: residency.zone,
      sovereignty: residency.sovereignty,
      tenantId,
      receivedAt: timestamp || new Date()
    });

    // 4. Audit
    await audit.logEvent({
      type: "inbound_fax",
      action: "inbound_fax_received",
      provider,
      faxId,
      tenantId,
      details: inboundFax
    });

    return inboundFax;
  }
};

function normalizeInboundPayload(event) {
  return {
    provider: event.provider || "unknown",
    faxId: event.faxId || event.id,
    fromNumber: event.from || event.callerId,
    toNumber: event.to || event.destination,
    pages: event.pages || 1,
    mediaUrl: event.mediaUrl || event.fileUrl,
    timestamp: event.timestamp || new Date(),
    tenantId: event.tenantId || null
  };
}

module.exports = inboundFaxService;
