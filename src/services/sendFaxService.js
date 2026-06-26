// src/services/sendFaxService.js

const sinch = require("../integrations/providers/sinchProvider");
const telnyx = require("../integrations/providers/telnyxProvider");
const FaxNovaError = require("../errors/FaxNovaError");

module.exports = {
  /**
   * Send a fax using validated input.
   * Failover: Sinch → Telnyx
   */
  async sendFax(validatedInput) {
    let primaryErr = null;

    // -------------------------
    // 1. Try Sinch (Primary)
    // -------------------------
    try {
      const result = await sinch.sendFax(validatedInput);
      return {
        provider: "sinch",
        providerId: result.providerId,
        status: result.status
      };
    } catch (err) {
      primaryErr = err;
    }

    // -------------------------
    // 2. Failover to Telnyx
    // -------------------------
    try {
      const result = await telnyx.sendFax(validatedInput);
      return {
        provider: "telnyx",
        providerId: result.providerId,
        status: result.status,
        failoverFrom: "sinch"
      };
    } catch (failoverErr) {
      // -------------------------
      // 3. Both providers failed
      // -------------------------
      throw new FaxNovaError("All providers unavailable", {
        provider: "multi",
        code: "ALL_PROVIDERS_FAILED",
        details: {
          sinch: primaryErr?.details || primaryErr?.message,
          telnyx: failoverErr?.details || failoverErr?.message
        }
      });
    }
  }
};
