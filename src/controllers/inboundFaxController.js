// src/controllers/inboundFaxController.js

const inboundFaxService = require("../services/inboundFaxService");
const FaxNovaError = require("../errors/FaxNovaError");
const audit = require("../utils/auditLogger");
const tenantService = require("../services/tenantService"); // resolves tenant by inbound number

module.exports = {
  /**
   * POST /fax/inbound/:provider
   *
   * Handles inbound fax webhooks from:
   * - Sinch
   * - Telnyx
   *
   * Steps:
   * 1. Validate provider
   * 2. Resolve tenant by inbound number
   * 3. Process inbound fax
   * 4. Return 200 OK to provider
   */
  async receiveInboundFax(req, res, next) {
    try {
      const provider = req.params.provider?.toLowerCase();

      if (!provider || !["sinch", "telnyx"].includes(provider)) {
        throw new FaxNovaError("Unsupported inbound provider", {
          code: "UNSUPPORTED_INBOUND_PROVIDER",
          provider
        });
      }

      const payload = req.body;

      // -----------------------------
      // 1. Extract inbound number
      // -----------------------------
      const inboundNumber =
        payload?.to ||
        payload?.data?.payload?.to ||
        null;

      if (!inboundNumber) {
        throw new FaxNovaError("Inbound fax missing destination number", {
          code: "INBOUND_NUMBER_MISSING",
          provider,
          payload
        });
      }

      // -----------------------------
      // 2. Resolve tenant by inbound number
      // -----------------------------
      const tenantId = await tenantService.resolveTenantByNumber(inboundNumber);

      if (!tenantId) {
        audit.error("inbound_fax_unassigned_number", {
          provider,
          inboundNumber
        });

        throw new FaxNovaError("No tenant assigned to inbound number", {
          code: "TENANT_NOT_FOUND_FOR_INBOUND_NUMBER",
          inboundNumber
        });
      }

      // -----------------------------
      // 3. Process inbound fax
      // -----------------------------
      const record = await inboundFaxService.processInboundFax(
        provider,
        payload,
        tenantId
      );

      // -----------------------------
      // 4. Provider requires 200 OK
      // -----------------------------
      res.status(200).json({
        message: "Inbound fax processed",
        faxId: record.faxId,
        tenantId
      });
    } catch (err) {
      next(err);
    }
  }
};
