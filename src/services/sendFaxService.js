// src/services/sendFaxService.js

const sinch = require("../integrations/providers/sinchProvider");
const telnyx = require("../integrations/providers/telnyxProvider");
const FaxNovaError = require("../errors/FaxNovaError");

module.exports = {
  async sendFax(payload) {
    let primaryErr = null;

    // Try Sinch first
    try {
      return await sinch.sendFax(payload);
    } catch (err) {
      primaryErr = err;
    }

    // Failover to Telnyx
    try {
      return await telnyx.sendFax(payload);
    } catch (failoverErr) {
      throw new FaxNovaError("All providers unavailable", {
        provider: "multi",
        code: "ALL_PROVIDERS_FAILED",
        details: {
          sinch: primaryErr?.details,
          telnyx: failoverErr?.details
        }
      });
    }
  }
};
