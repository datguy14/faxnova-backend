// src/services/retryFaxService.js

const FaxNovaError = require("../errors/FaxNovaError");
const sendFaxService = require("./sendFaxService");

module.exports = {
  async retryFax({ faxId, originalPayload }) {
    if (!originalPayload) {
      throw new FaxNovaError("Original fax payload missing", {
        code: "MISSING_ORIGINAL_PAYLOAD",
        details: { faxId }
      });
    }

    try {
      const result = await sendFaxService.sendFax(originalPayload);

      return {
        faxId,
        retried: true,
        provider: result.provider,
        providerId: result.providerId,
        status: result.status
      };
    } catch (err) {
      throw new FaxNovaError("Retry failed", {
        code: "RETRY_FAILED",
        details: {
          faxId,
          error: err.details || err.message
        }
      });
    }
  }
};
