// src/services/sendFaxService.js

const sinch = require("../integrations/providers/sinchProvider");
const telnyx = require("../integrations/providers/telnyxProvider");
const FaxNovaError = require("../errors/FaxNovaError");

module.exports = {
  async sendFax(validatedInput) {
    // validatedInput is guaranteed safe by Zod
    let primaryErr = null;

    try {
      return await sinch.sendFax(validatedInput);
    } catch (err) {
      primaryErr = err;
    }

    try {
      return await telnyx.sendFax(validatedInput);
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
