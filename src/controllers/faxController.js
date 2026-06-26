// src/controllers/faxController.js

const { faxSendSchema } = require("../validation/faxSendSchema");
const sendFaxService = require("../services/sendFaxService");
const FaxNovaError = require("../errors/FaxNovaError");

module.exports = {
  /**
   * POST /fax/send
   * Validates input → sends fax → returns provider response
   */
  async sendFax(req, res, next) {
    try {
      // Validate request body with Zod
      const parsed = faxSendSchema.parse(req.body);

      // Pass validated input to service
      const result = await sendFaxService.sendFax(parsed);

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /fax/:id
   * Fetch fax metadata (placeholder until DB integration)
   */
  async getFaxById(req, res, next) {
    try {
      const faxId = req.params.id;

      if (!faxId) {
        throw new FaxNovaError("Fax ID is required", {
          code: "FAX_ID_MISSING"
        });
      }

      // Placeholder — replace with DB lookup later
      res.json({
        faxId,
        status: "lookup_not_implemented"
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /fax/:id/retry
   * Retry fax sending (placeholder until retry engine is added)
   */
  async retryFax(req, res, next) {
    try {
      const faxId = req.params.id;

      if (!faxId) {
        throw new FaxNovaError("Fax ID is required for retry", {
          code: "FAX_ID_MISSING"
        });
      }

      // Placeholder — retry engine will be added later
      res.json({
        faxId,
        status: "retry_not_implemented"
      });
    } catch (err) {
      next(err);
    }
  }
};
