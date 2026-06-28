// src/controllers/outboundFaxController.js

const OutboundFax = require("../models/OutboundFax");
const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../audit/auditService");

module.exports = {
  /**
   * GET /outbound
   *
   * Paginated outbound fax list for tenant.
   */
  async listOutboundFaxes(req, res, next) {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        throw new FaxNovaError("Missing tenant context", {
          code: "TENANT_CONTEXT_MISSING"
        });
      }

      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);

      const faxes = await OutboundFax.find({ tenantId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await OutboundFax.countDocuments({ tenantId });

      res.status(200).json({
        page,
        limit,
        total,
        faxes
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /outbound/:id
   *
   * Fetch a single outbound fax record for the tenant.
   */
  async getOutboundFaxById(req, res, next) {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      const faxId = req.params.id;

      const fax = await OutboundFax.findOne({ _id: faxId, tenantId });

      if (!fax) {
        throw new FaxNovaError("Outbound fax not found", {
          code: "OUTBOUND_FAX_NOT_FOUND",
          faxId
        });
      }

      res.status(200).json(fax);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /outbound/:id
   *
   * Delete an outbound fax record for the tenant.
   */
  async deleteOutboundFax(req, res, next) {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        throw new FaxNovaError("Missing tenant context", {
          code: "TENANT_CONTEXT_MISSING"
        });
      }

      const faxId = req.params.id;

      const fax = await OutboundFax.findOne({ _id: faxId, tenantId });

      if (!fax) {
        audit.logEvent({
          tenantId,
          type: "outbound_fax",
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
          error: "Outbound fax not found",
          correlationId: req.correlationId
        });
      }

      await OutboundFax.deleteOne({ _id: faxId, tenantId });

      audit.logEvent({
        tenantId,
        type: "outbound_fax",
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

      res.json({
        success: true,
        message: "Outbound fax deleted successfully",
        faxId,
        correlationId: req.correlationId
      });
    } catch (err) {
      audit.logEvent({
        tenantId: req.tenantId || req.user?.tenantId,
        type: "outbound_fax",
        action: "delete_failed",
        correlationId: req.correlationId,
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
        tier: req.apiTier,
        details: { error: err.message }
      });

      next(
        new FaxNovaError("Failed to delete outbound fax", {
          code: "OUTBOUND_FAX_DELETE_FAILED",
          details: err.message
        })
      );
    }
  }
const FaxNovaError = require("../errors/FaxNovaError");
const sendFaxService = require("../services/sendFaxService");
const OutboundFax = require("../models/OutboundFax");
const audit = require("../audit/auditService");

/**
 * Outbound Fax Controller (FaxNova v1)
 *
 * Responsibilities:
 * - Extract tenant context
 * - Validate outbound fax request
 * - Call sendFaxService (Routing Engine v2 + provider adapters)
 * - Create outbound fax record
 * - Audit log event
 */

async function sendOutboundFax(req, res) {
  try {
    // -----------------------------
    // 1. Tenant extraction
    // -----------------------------
    const tenantId = req.tenantId;

    if (!tenantId) {
      throw new FaxNovaError("Missing tenant context", {
        code: "TENANT_CONTEXT_MISSING"
      });
    }

    // -----------------------------
    // 2. Validate request body
    // -----------------------------
    const { to, from, pages, documentUrl, residencyZone, tier } = req.body;

    if (!to || !from || !documentUrl) {
      throw new FaxNovaError("Missing required outbound fax fields", {
        code: "OUTBOUND_FIELDS_MISSING",
        fields: { to, from, documentUrl }
      });
    }

    // -----------------------------
    // 3. Send fax via Routing Engine v2
    // -----------------------------
    const result = await sendFaxService.sendFax({
      tenantId,
      to,
      from,
      pages: pages || 1,
      documentUrl,
      residencyZone: residencyZone || "us",
      tier: tier || "basic"
    });

    const {
      provider,
      failoverProvider,
      jobId,
      latencyMs,
      routingScore
    } = result;

    // -----------------------------
    // 4. Create outbound fax record
    // -----------------------------
    const faxRecord = await OutboundFax.create({
      tenantId,
      provider,
      failoverProvider,
      to,
      from,
      pages: pages || 1,
      documentUrl,
      residencyZone: residencyZone || "us",
      tier: tier || "basic",
      jobId,
      latencyMs,
      routingScore,
      createdAt: new Date()
    });

    // -----------------------------
    // 5. Audit log
    // -----------------------------
    audit.logEvent({
      tenantId,
      type: "outbound_fax",
      action: "sent",
      details: {
        provider,
        failoverProvider,
        to,
        from,
        pages,
        jobId,
        latencyMs,
        routingScore
      }
    });

    return res.status(200).json({
      success: true,
      faxId: faxRecord._id,
      provider,
      failoverProvider,
      jobId
    });
  } catch (err) {
    const error = new FaxNovaError("Outbound fax processing failed", {
      code: "OUTBOUND_CONTROLLER_FAILED",
      details: err.message
    });

    return res.status(400).json({
      success: false,
      error: error.serialize()
    });
  }
}

module.exports = {
  sendOutboundFax
};
