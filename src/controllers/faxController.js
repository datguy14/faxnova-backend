// src/controllers/faxController.js

const Fax = require("../models/Fax");
const auditService = require("../services/auditService");

exports.listFaxes = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const faxes = await Fax.find({ tenantId }).sort({ createdAt: -1 });

    return res.json({ success: true, data: faxes });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getFax = async (req, res) => {
  try {
    const { tenantId, faxId } = req.params;

    const fax = await Fax.findOne({ _id: faxId, tenantId });

    if (!fax) {
      return res.status(404).json({ success: false, error: "Fax not found" });
    }

    return res.json({ success: true, data: fax });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteFax = async (req, res) => {
  try {
    const { tenantId, faxId } = req.params;

    const fax = await Fax.findOneAndDelete({ _id: faxId, tenantId });

    if (!fax) {
      return res.status(404).json({ success: false, error: "Fax not found" });
    }

    await auditService.logEvent({
      tenantId,
      faxId,
      type: "fax_outbound",
      action: "fax_deleted",
      details: { faxId }
    });

    return res.json({ success: true, message: "Fax deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
