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
const FaxNovaError = require("../errors/FaxNovaError");
const inboundFaxService = require("../services/inboundFaxService");
const tenantService = require("../services/tenantService");
const residencyEngine = require("../services/residencyEngine");
const InboundFax = require("../models/InboundFax");
const audit = require("../audit/auditService");

/**
 * Inbound Fax Controller (FaxNova v1)
 *
 * Responsibilities:
 * - Detect provider (Sinch / Telnyx)
 * - Normalize inbound payload
 * - Resolve tenant by inbound number
 * - Apply residency + sovereignty rules
 * - Create inbound fax record
 * - Audit log event
 */

async function handleInbound(req, res) {
  try {
    const providerName = req.params.provider; // "sinch" or "telnyx"
    const payload = req.body;

    if (!providerName) {
      throw new FaxNovaError("Missing inbound provider", {
        code: "INBOUND_PROVIDER_MISSING"
      });
    }

    // -----------------------------
    // 1. Normalize inbound fax
    // -----------------------------
    const normalized = await inboundFaxService.handleInbound(
      providerName,
      payload
    );

    const { from, to, pages, mediaUrl, residencyZone, sovereignty, jobId, receivedAt } =
      normalized;

    // -----------------------------
    // 2. Resolve tenant by inbound number
    // -----------------------------
    const tenant = await tenantService.resolveTenantByInboundNumber(to);

    if (!tenant) {
      throw new FaxNovaError("Inbound number not assigned to any tenant", {
        code: "TENANT_NOT_FOUND",
        inboundNumber: to
      });
    }

    const tenantId = tenant._id.toString();

    // -----------------------------
    // 3. Residency + sovereignty engine
    // -----------------------------
    const residency = residencyEngine.resolveInboundResidency({
      from,
      to,
      residencyZone,
      sovereignty
    });

    // -----------------------------
    // 4. Create inbound fax record
    // -----------------------------
    const faxRecord = await InboundFax.create({
      tenantId,
      provider: providerName,
      from,
      to,
      pages,
      mediaUrl,
      residencyZone: residency.zone,
      sovereignty: residency.sovereignty,
      jobId,
      receivedAt
    });

    // -----------------------------
    // 5. Audit log
    // -----------------------------
    audit.logEvent({
      tenantId,
      type: "inbound_fax",
      action: "received",
      details: {
        provider: providerName,
        inboundNumber: to,
        from,
        pages,
        jobId
      }
    });

    return res.status(200).json({
      success: true,
      faxId: faxRecord._id,
      provider: providerName
    });
  } catch (err) {
    const error = new FaxNovaError("Inbound fax processing failed", {
      code: "INBOUND_CONTROLLER_FAILED",
      details: err.message
    });

    return res.status(400).json({
      success: false,
      error: error.serialize()
    });
  }
}

module.exports = {
  handleInbound
};
