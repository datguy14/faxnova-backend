// src/controllers/inboundFaxController.js

const inboundFaxService = require("../services/inboundFaxService");
const InboundFax = require("../models/InboundFax");
const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../audit/auditService");

module.exports = {
  /**
   * POST /inbound/:provider
   *
   * Handles inbound fax webhooks from Sinch or Telnyx.
   */
  async receiveInboundFax(req, res, next) {
    try {
      const provider = req.params.provider;

      // -----------------------------
      // Tenant context
      // -----------------------------
      const tenantId = req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        throw new FaxNovaError("Missing tenant context", {
          code: "TENANT_CONTEXT_MISSING"
        });
      }

      // -----------------------------
      // Process inbound fax via provider adapter
      // -----------------------------
      const inboundResult = await inboundFaxService.handleInbound(provider, req.body);

      // -----------------------------
      // Save inbound fax record
      // -----------------------------
      const faxRecord = await InboundFax.create({
        tenantId,
        provider,
        from: inboundResult.from,
        to: inboundResult.to,
        pages: inboundResult.pages,
        mediaUrl: inboundResult.mediaUrl,
        residencyZone: inboundResult.residencyZone,
        sovereignty: inboundResult.sovereignty,
        jobId: inboundResult.jobId,
        receivedAt: inboundResult.receivedAt || new Date()
      });

      // -----------------------------
      // Audit event
      // -----------------------------
      audit.logEvent({
        tenantId,
        type: "inbound_fax",
        action: "received",
        correlationId: req.correlationId,
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
        tier: req.apiTier,
        details: {
          provider,
          jobId: inboundResult.jobId,
          from: inboundResult.from,
          to: inboundResult.to
        }
      });

      res.status(200).json({
        success: true,
        message: "Inbound fax processed",
        faxId: faxRecord._id,
        provider,
        jobId: inboundResult.jobId
      });
    } catch (err) {
      audit.logEvent({
        tenantId: req.tenantId || req.user?.tenantId,
        type: "inbound_fax",
        action: "receive_failed",
        correlationId: req.correlationId,
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
        tier: req.apiTier,
        details: { error: err.message }
      });

      next(err);
    }
  },

  /**
   * GET /inbound
   *
   * Paginated inbound fax list for tenant.
   */
  async listInboundFaxes(req, res, next) {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        throw new FaxNovaError("Missing tenant context", {
          code: "TENANT_CONTEXT_MISSING"
        });
      }

      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);

      const faxes = await InboundFax.find({ tenantId })
        .sort({ receivedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await InboundFax.countDocuments({ tenantId });

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
   * GET /inbound/:id
   *
   * Fetch a single inbound fax record for the tenant.
   */
  async getInboundFaxById(req, res, next) {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      const faxId = req.params.id;

      const fax = await InboundFax.findOne({ _id: faxId, tenantId });

      if (!fax) {
        throw new FaxNovaError("Inbound fax not found", {
          code: "INBOUND_FAX_NOT_FOUND",
          faxId
        });
      }

      res.status(200).json(fax);
    } catch (err) {
      next(err);
    }
  }
};
