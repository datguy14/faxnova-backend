// src/services/outboundFaxService.js — STRICT-MODE FINAL VERSION

const OutboundFax = require("../models/OutboundFax");
const providerRoutingEngine = require("./providerRoutingEngine");
const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../utils/auditLogger");
const { v4: uuid } = require("uuid");

module.exports = {
  /**
   * Create a new outbound fax (strict‑mode)
   */
  async createFax({ to, from, mediaUrl, callbackUrl, userId, residencyZone, sovereignty }) {
    if (!to || !from || !mediaUrl) {
      throw new FaxNovaError("Missing required fax fields", {
        code: "FAX_FIELDS_REQUIRED"
      });
    }

    // Normalize residency + sovereignty
    const region = residencyZone || sovereignty || "us";

    // Generate faxId if model doesn't auto-generate it
    const faxId = uuid();

    // Strict‑mode provider selection
    const provider = await providerRoutingEngine.selectProviderForFax({
      faxId,
      toNumber: to,
      fromNumber: from,
      region,
      residencyZone,
      sovereignty,
      userId,
      retry: false
    });

    // Create fax record
    const fax = await OutboundFax.create({
      faxId,
      toNumber: to,
      fromNumber: from,
      documentUrl: mediaUrl,
      callbackUrl,
      userId,
      residencyZone,
      sovereignty,
      provider,
      status: "queued",
      createdAt: new Date()
    });

    audit.log("outboundFaxCreated", {
      faxId,
      provider,
      userId,
      region
    });

    return fax;
  },

  /**
   * Update fax status (strict‑mode)
   */
  async updateStatus(faxId, status) {
    if (!faxId) {
      throw new FaxNovaError("faxId is required to update status", {
        code: "FAX_ID_REQUIRED"
      });
    }

    const fax = await OutboundFax.findOneAndUpdate(
      { faxId },
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
    const fax = await OutboundFax.findOne({ faxId });
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
