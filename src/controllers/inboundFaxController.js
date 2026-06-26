// src/controllers/inboundFaxController.js

const inboundFaxService = require("../services/inboundFaxService");
const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../utils/auditLogger");

module.exports = {
  /**
   * POST /webhooks/inbound/:provider
   * Handles inbound fax webhooks from Sinch, Telnyx, etc.
   */
  async receiveInboundFax(req, res, next) {
    try {
      const provider = req.params.provider?.toLowerCase();

      if (!provider) {
        throw new FaxNovaError("Provider is required for inbound fax", {
          code: "INBOUND_PROVIDER_REQUIRED"
        });
      }

      const payload = req.body;

      const record = await inboundFaxService.processInboundFax(provider, payload);

      audit.log("inbound_fax_webhook_processed", {
        provider,
        faxId: record.faxId,
        tenantId: record.tenantId
      });

      res.status(200).json({
        message: "Inbound fax processed",
        provider,
        faxId: record.faxId
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /inbound/:id
   * Fetch a single inbound fax record (tenant‑scoped)
   */
  async getInboundFax(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new FaxNovaError("Tenant ID required", {
          code: "TENANT_ID_REQUIRED"
        });
      }

      const record = await inboundFaxService.getInboundFaxById(id, tenantId);

      if (!record) {
        throw new FaxNovaError("Inbound fax not found", {
          code: "INBOUND_NOT_FOUND",
          faxId: id
        });
      }

      res.status(200).json(record);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /inbound
   * Paginated inbound fax list (tenant‑scoped)
   */
  async listInboundFaxes(req, res, next) {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new FaxNovaError("Tenant ID required", {
          code: "TENANT_ID_REQUIRED"
        });
      }

      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);

      const result = await inboundFaxService.listInboundFaxes(tenantId, page, limit);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
};
