// src/controllers/inboundFaxController.js

const Fax = require("../models/Fax");
const FaxEvent = require("../models/FaxEvent");

const dataResidencyGuard = require("../guards/dataResidencyGuard");
const idempotencyGuard = require("../guards/idempotencyGuard");

const auditService = require("../services/auditService");
const faxStorageService = require("../services/faxStorageService");

exports.receiveInboundFax = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { from, region, storageKey, provider, providerMessageId } = req.body;

    // Idempotency check
    const idempotent = await idempotencyGuard.check({
      tenantId,
      key: providerMessageId
    });

    if (!idempotent.ok) {
      return res.status(409).json({
        success: false,
        error: "Duplicate inbound fax"
      });
    }

    // Residency guard
    const residency = await dataResidencyGuard.validateInbound({
      tenantId,
      region
    });

    if (!residency.allowed) {
      return res.status(403).json({
        success: false,
        error: "Inbound fax blocked by residency rules"
      });
    }

    // Create fax record
    const fax = await Fax.create({
      tenantId,
      direction: "inbound",
      from,
      region,
      storageKey,
      provider,
      providerMessageId,
      status: "received"
    });

    // Log event
    await auditService.logEvent({
      tenantId,
      faxId: fax._id,
      type: "fax_inbound",
      action: "fax_received",
      details: { providerMessageId }
    });

    return res.json({
      success: true,
      data: fax
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

exports.getInboundFax = async (req, res) => {
  try {
    const { tenantId, faxId } = req.params;

    const fax = await Fax.findOne({
      _id: faxId,
      tenantId,
      direction: "inbound"
    });

    if (!fax) {
      return res.status(404).json({
        success: false,
        error: "Inbound fax not found"
      });
    }

    return res.json({
      success: true,
      data: fax
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

exports.listInboundFaxes = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const faxes = await Fax.find({
      tenantId,
      direction: "inbound"
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: faxes
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
