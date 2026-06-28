// src/controllers/faxController.js

const sendFaxService = require("../services/sendFaxService");
const Fax = require("../models/Fax");
const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../utils/auditLogger");
const { sendFaxSchema } = require("../validation/faxSchemas"); // Zod schema

module.exports = {
  /**
   * POST /fax/send
   *
   * Steps:
   * 1. Validate request body (Zod)
   * 2. Extract tenantId from auth middleware
   * 3. Call sendFaxService
   * 4. Save fax record
   * 5. Audit event
   * 6. Return response
   */
  async sendFax(req, res, next) {
    try {
      // 1. Validate request body
      const parsed = sendFaxSchema.parse(req.body);
      const { to, from, pages, documentUrl, residencyZone, tier } = parsed;

      // 2. Tenant ID from auth middleware
      const tenantId = req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        throw new FaxNovaError("Missing tenant context", {
          code: "TENANT_CONTEXT_MISSING"
        });
      }

      // 3. Send fax via Routing Engine v2
      const result = await sendFaxService.sendFax({
        residencyZone,
        tier,
        to,
        from,
        pages,
        documentUrl
      });

      // 4. Save fax record
      const faxRecord = await Fax.create({
        tenantId,
        provider: result.provider,
        failoverProvider: result.failoverProvider,
        routingScore: result.routingScore,
        to,
        from,
        pages,
        documentUrl,
        jobId: result.jobId,
        residencyZone,
        tier,
        status: "sent",
        latencyMs: result.latencyMs
      });

      // 5. Audit event
      audit.log("fax_sent", {
        tenantId,
        provider: result.provider,
        failoverProvider: result.failoverProvider,
        jobId: result.jobId,
        residencyZone,
        tier
      });

      // 6. Response
      res.status(200).json({
        message: "Fax sent successfully",
        faxId: faxRecord._id,
        provider: result.provider,
        failoverProvider: result.failoverProvider,
        jobId: result.jobId,
        latencyMs: result.latencyMs
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /fax/:id
   *
   * Fetch a fax record for the authenticated tenant.
   */
  async getFaxById(req, res, next) {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      const faxId = req.params.id;

      const fax = await Fax.findOne({ _id: faxId, tenantId });

      if (!fax) {
        throw new FaxNovaError("Fax not found", {
          code: "FAX_NOT_FOUND",
          faxId
        });
      }

      res.status(200).json(fax);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /fax
   *
   * Paginated fax list for tenant.
   */
  async listFaxes(req, res, next) {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;

      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);

      const faxes = await Fax.find({ tenantId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Fax.countDocuments({ tenantId });

      res.status(200).json({
        page,
        limit,
        total,
        faxes
      });
    } catch (err) {
      next(err);
    }
  }
};
