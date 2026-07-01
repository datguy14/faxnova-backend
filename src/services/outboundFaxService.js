// src/services/outboundFaxService.js

const OutboundFax = require("../models/OutboundFax");
const providerRoutingRules = require("./providerRoutingRules");
const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../utils/auditLogger");

module.exports = {
  /**
   * Create a new outbound fax
   */
  async createFax({ to, from, mediaUrl, callbackUrl, userId, residencyZone }) {
    if (!to || !from || !mediaUrl) {
      throw new FaxNovaError("Missing required fax fields", {
        code: "FAX_FIELDS_REQUIRED"
      });
    }

    // Select provider based on sovereignty + routing rules
    const provider = await providerRoutingRules.selectBestProvider(residencyZone);

    const fax = await OutboundFax.create({
      to,
      from,
      mediaUrl,
      callbackUrl,
      userId,
      residencyZone,
      provider: provider.name,
      status: "queued",
      createdAt: new Date()
    });

    audit.log("outboundFaxCreated", {
      faxId: fax.id,
      provider: provider.name,
      userId
    });

    return fax;
  },

  /**
   * Update fax status (called by webhookController)
   */
  async updateStatus(faxId, status) {
    if (!faxId) {
      throw new FaxNovaError("faxId is required to update status", {
        code: "FAX_ID_REQUIRED"
      });
    }

    const fax = await OutboundFax.findByIdAndUpdate(
      faxId,
      {
        status,
        lastEventAt: new Date()
      },
      { new: true }
    );

    audit.log("outboundFaxStatusUpdated", {
      faxId,
      status
    });

    return fax;
  },

  /**
   * Get fax by ID
   */
  async getFax(faxId) {
    const fax = await OutboundFax.findById(faxId);
    if (!fax) {
      throw new FaxNovaError("Fax not found", {
        code: "FAX_NOT_FOUND"
      });
    }
    return fax;
  },

  /**
   * List faxes for a user
   */
  async listFaxes(userId, limit = 100) {
    return OutboundFax.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
};
