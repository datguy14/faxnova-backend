// faxService.js

const Fax = require("../models/Fax");
const providerRoutingEngine = require("./providerRoutingEngine");
const providerPerformanceService = require("./providerPerformanceService");
const providerHealthService = require("./providerHealthService");
const outboundFaxQueue = require("../workers/outboundFaxQueue");
const retryFaxQueue = require("../workers/retryFaxQueue");

module.exports = {
  // ---------------------------------------------------------
  // Create Fax Job (Send Fax)
  // ---------------------------------------------------------
  async createFaxJob(data) {
    const provider = await providerRoutingEngine.selectProvider();

    const fax = await Fax.create({
      to: data.to,
      from: data.from,
      fileUrl: data.fileUrl,
      provider,
      status: "queued",
      attempts: 0,
      history: [
        { event: "queued", timestamp: Date.now(), provider }
      ]
    });

    await outboundFaxQueue.add({ faxId: fax._id, provider });

    return fax;
  },

  // ---------------------------------------------------------
  // Update Fax Status
  // ---------------------------------------------------------
  async updateFaxStatus(faxId, status) {
    const fax = await Fax.findById(faxId);
    if (!fax) return null;

    fax.status = status;
    fax.history.push({
      event: status,
      timestamp: Date.now(),
      provider: fax.provider
    });

    await fax.save();
    return fax;
  },

  // ---------------------------------------------------------
  // Add Fax Event to History
  // ---------------------------------------------------------
  async addEvent(faxId, event, meta = {}) {
    const fax = await Fax.findById(faxId);
    if (!fax) return null;

    fax.history.push({
      event,
      timestamp: Date.now(),
      provider: fax.provider,
      ...meta
    });

    await fax.save();
    return fax;
  },

  // ---------------------------------------------------------
  // Retry Fax
  // ---------------------------------------------------------
  async retryFax(faxId) {
    const fax = await Fax.findById(faxId);
    if (!fax) return null;

    fax.attempts += 1;
    fax.status = "retrying";

    fax.history.push({
      event: "retrying",
      timestamp: Date.now(),
      provider: fax.provider
    });

    await fax.save();
    await retryFaxQueue.add({ faxId });

    return fax;
  },

  // ---------------------------------------------------------
  // Resend Fax (New Provider)
  // ---------------------------------------------------------
  async resendFax(faxId) {
    const fax = await Fax.findById(faxId);
    if (!fax) return null;

    const newProvider = await providerRoutingEngine.selectProvider();

    fax.provider = newProvider;
    fax.status = "resent";

    fax.history.push({
      event: "resent",
      timestamp: Date.now(),
      provider: newProvider
    });

    await fax.save();
    await outboundFaxQueue.add({ faxId, provider: newProvider });

    return fax;
  },

  // ---------------------------------------------------------
  // Delete Fax
  // ---------------------------------------------------------
  async deleteFax(faxId) {
    const fax = await Fax.findById(faxId);
    if (!fax) return null;

    await Fax.deleteOne({ _id: faxId });

    return { success: true };
  },

  // ---------------------------------------------------------
  // Download Fax (Metadata Only)
  // ---------------------------------------------------------
  async getFaxDownload(faxId) {
    const fax = await Fax.findById(faxId);
    if (!fax) return null;

    return {
      fileUrl: fax.fileUrl,
      provider: fax.provider,
      status: fax.status
    };
  },

  // ---------------------------------------------------------
  // Fax Event History
  // ---------------------------------------------------------
  async getFaxHistory(faxId) {
    const fax = await Fax.findById(faxId);
    if (!fax) return null;

    return fax.history;
  }
};
