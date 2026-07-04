// src/controllers/outboundFaxController.js

const Fax = require("../models/Fax");
const FaxEvent = require("../models/FaxEvent");

const dataResidencyGuard = require("../guards/dataResidencyGuard");
const idempotencyGuard = require("../guards/idempotencyGuard");

const providerApiService = require("../services/providerApiService");
const auditService = require("../services/auditService");
const faxStorageService = require("../services/faxStorageService");

exports.sendFax = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { to, region, storageKey } = req.body;

    // Idempotency check
    const idempotent = await idempotencyGuard.check({
      tenantId,
      key: `${tenantId}:${to}:${storageKey}`
    });

    if (!idempotent.ok) {
      return res.status(409).json({
        success: false,
        error: "Duplicate outbound fax request"
      });
    }

    // Residency guard
    const residency = await dataResidencyGuard.validateOutbound({
      tenantId,
      region
    });

    if (!residency.allowed) {
      return res.status(403).json({
        success: false,
        error: "Outbound fax blocked by residency rules"
      });
    }

    // Send fax via provider API
    const providerResult = await providerApiService.sendFax({
      to,
      storageKey,
      region
    });

    // Create fax record
    const fax = await Fax.create({
      tenantId,
      direction: "outbound",
      to,
      region,
      storageKey,
      provider: providerResult.provider,
      providerMessageId: providerResult.messageId,
      status: "queued"
    });

    // Log event
    await auditService.logEvent({
      tenantId,
      faxId: fax._id,
      type: "fax_outbound",
      action: "fax_queued",
      details: {
        provider: providerResult.provider,
        providerMessageId: providerResult.messageId
      }
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

exports.getFaxStatus = async (req, res) => {
  try {
    const { tenantId, faxId } = req.params;

    const fax = await Fax.findOne({
      _id: faxId,
      tenantId,
      direction: "outbound"
    });

    if (!fax) {
      return res.status(404).json({
        success: false,
        error: "Outbound fax not found"
      });
    }

    return res.json({
      success: true,
      data: { status: fax.status }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

exports.retryFax = async (req, res) => {
  try {
    const { tenantId, faxId } = req.params;

    const fax = await Fax.findOne({
      _id: faxId,
      tenantId,
      direction: "outbound"
    });

    if (!fax) {
      return res.status(404).json({
        success: false,
        error: "Outbound fax not found"
      });
    }

    // Retry via provider API
    const providerResult = await providerApiService.sendFax({
      to: fax.to,
      storageKey: fax.storageKey,
      region: fax.region
    });

    fax.status = "queued";
    fax.provider = providerResult.provider;
    fax.providerMessageId = providerResult.messageId;
    await fax.save();

    // Log event
    await auditService.logEvent({
      tenantId,
      faxId: fax._id,
      type: "fax_outbound",
      action: "fax_retried",
      details: {
        provider: providerResult.provider,
        providerMessageId: providerResult.messageId
      }
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
