// src/services/providerApiService.js

const telnyxAdapter = require("../providers/telnyxAdapter");
const sinchAdapter = require("../providers/sinchAdapter");

exports.sendFax = async fax => {
  switch (fax.provider) {
    case "telnyx":
      return await telnyxAdapter.sendFax(fax);

    case "sinch":
      return await sinchAdapter.sendFax(fax);

    default:
      throw new Error(`Unknown provider: ${fax.provider}`);
  }
};
