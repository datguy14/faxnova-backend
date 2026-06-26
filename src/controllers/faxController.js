// src/controllers/faxController.js

const sendFaxService = require("../services/sendFaxService");
const inboundFaxQueryService = require("../services/inboundFaxQueryService");
const Fax = require("../models/Fax");

const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../utils/auditLogger");

module.exports = {
  /**
   * POST /fax/send
   * Send outbound fax using Routing Engine v2.
   */
  async sendFax(req, res, next) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new FaxNovaError("Tenant ID required", {
          code: "TENANT_ID_REQUIRED"
        });
      }

      const { to, from, pages, documentUrl } = req.body;

      if (!to || !from || !pages || !documentUrl) {
        throw new FaxNovaError("Missing required fax fields", {
          code: "FAX_FIELDS_REQUIRED",
          details: req.body
        });
      }

      const residencyZone = req.residencyZone || "us";
      const tier = req.user?.tier || "basic";

      // -----------------------------
      // 1. Send fax via routing engine
      // -----------------------------
      const result = await sendFaxService.sendFax({
        residencyZone,
        tier,
        to,
        from,
        pages,
        documentUrl
      });

      // -----------------------------
      // 2. Store outbound fax record
      // -----------------------------
      const record = await Fax.create({
        tenantId,
        provider: result.provider,
        failoverProvider: result.failoverProvider || null,
        routingScore: result.routingScore,
        to,
        from,
        pages,
        documentUrl,
        jobId: result.jobId,
        residencyZone,
        tier,
        status: "sent",
        latencyMs: result.latencyMs,
        createdAt: new Date()
      });

      audit.log("fax_sent", {
        tenantId,
        provider: result.provider,
        failoverProvider: result.failoverProvider,
        jobId: result.jobId
      });

      res.status(200).json({
        message: "Fax sent successfully",
        faxId: record._id,
        provider: result.provider,
        failoverProvider: result.failoverProvider || null,
        jobId: result.jobId
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /fax/:id
   * Fetch outbound fax record (tenant‑scoped)
   */
  async getFax(req, res, next) {
    try {
      const tenantId = req.user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        throw new FaxNovaError("Tenant ID required", {
          code: "TENANT_ID_REQUIRED"
        });
      }

      const record = await Fax.findOne({ _id: id, tenantId });

      if (!record) {
        throw new FaxNovaError("Fax not found", {
          code: "FAX_NOT_FOUND",
          faxId: id
        });
      }

      res.status(200).json(record);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /fax
   * Paginated outbound fax list (tenant‑scoped)
   */
  async listFaxes(req, res, next) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new FaxNovaError("Tenant ID required", {
          code: "TENANT_ID_REQUIRED"
        });
      }

      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);

      const query = { tenantId };

      const total = await Fax.countDocuments(query);

      const items = await Fax.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      res.status(200).json({
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        items
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /fax/inbound
   * Paginated inbound fax list (tenant‑scoped)
   */
  async listInbound(req, res, next) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new FaxNovaError("Tenant ID required", {
          code: "TENANT_ID_REQUIRED"
        });
      }

      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);

      const result = await inboundFaxQueryService.listInboundFaxes({
        tenantId,
        page,
        limit
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
};
