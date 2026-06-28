// src/controllers/faxDeleteController.js

const Fax = require("../models/Fax");
const audit = require("../audit/auditService");
const FaxNovaError = require("../errors/FaxNovaError");

exports.deleteFaxController = async (req, res, next) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      throw new FaxNovaError("Missing tenant context", {
        code: "TENANT_CONTEXT_MISSING"
      });
    }

    const { faxId } = req.params;

    // -----------------------------
    // Lookup fax (tenant‑scoped)
    // -----------------------------
    const fax = await Fax.findOne({ _id: faxId, tenantId });

    if (!fax) {
      audit.logEvent({
        tenantId,
        type: "fax",
        action: "delete_failed_not_found",
        correlationId: req.correlationId,
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
        tier: req.apiTier,
        details: { faxId }
      });

      return res.status(404).json({
        success: false,
        error: "Fax not found",
        correlationId: req.correlationId
      });
    }

    // -----------------------------
    // Delete fax
    // -----------------------------
    await Fax.deleteOne({ _id: faxId, tenantId });

    // -----------------------------
    // Audit: delete success
    // -----------------------------
    audit.logEvent({
      tenantId,
      type: "fax",
      action: "delete_success",
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier,
      details: {
        faxId,
        providerFaxId: fax.providerFaxId
      }
    });

    // -----------------------------
    // Response
    // -----------------------------
    res.json({
      success: true,
      message: "Fax deleted successfully",
      faxId,
      correlationId: req.correlationId
    });

  } catch (err) {
    console.error("Fax delete error:", err.message);

    audit.logEvent({
      tenantId: req.tenantId || req.user?.tenantId,
      type: "fax",
      action: "delete_failed",
      correlationId: req.correlationId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      tier: req.apiTier,
      details: { error: err.message }
    });

    next(
      new FaxNovaError("Failed to delete fax", {
        code: "FAX_DELETE_FAILED",
        details: err.message
      })
    );
  }
};
