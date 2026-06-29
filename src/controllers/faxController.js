// src/controllers/faxController.js

const OutboundFax = require("../models/OutboundFax");
const outboundFaxQueue = require("../queue/outboundFaxQueue");
const FaxNovaError = require("../errors/FaxNovaError");

async function sendFax(req, res) {
  try {
    const { tenantId, to, from, pages, documentUrl, region, tier } = req.body;

    if (!tenantId || !to || !from || !pages || !documentUrl || !region) {
      throw new FaxNovaError("Missing required fields", {
        code: "FAX_VALIDATION_ERROR"
      });
    }

    // Create async fax record
    const faxRecord = await OutboundFax.create({
      tenantId,
      to,
      from,
      pages,
      documentUrl,
      region,
      tier,
      status: "queued",
      createdAt: new Date()
    });

    // Push job into outbound queue
    await outboundFaxQueue.add(
      "sendFax",
      {
        faxId: faxRecord.faxId,
        tenantId,
        to,
        from,
        pages,
        documentUrl,
        region,
        tier
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 30000 }
      }
    );

    return res.json({
      success: true,
      faxId: faxRecord.faxId,
      message: "Fax queued for async processing"
    });

  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
}

async function getFaxById(req, res) {
  try {
    const { faxId } = req.params;

    const fax = await OutboundFax.findOne({ faxId });
    if (!fax) {
      throw new FaxNovaError("Fax not found", {
        code: "FAX_NOT_FOUND",
        faxId
      });
    }

    return res.json({ success: true, fax });
  } catch (err) {
    return res.status(404).json({
      success: false,
      error: err.message
    });
  }
}

async function listFaxes(req, res) {
  try {
    const { tenantId } = req.params;

    const faxes = await OutboundFax.find({ tenantId }).sort({ createdAt: -1 });

    return res.json({ success: true, faxes });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
}

module.exports = {
  sendFax,
  getFaxById,
  listFaxes
};
