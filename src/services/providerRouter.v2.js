// src/services/providerRouter.v2.js

const ProviderError = require("../errors/ProviderError");

class ProviderRouter {
  static pickOutboundProvider(provider) {
    if (provider !== "telnyx" && provider !== "sinch") {
      throw new ProviderError(`Unknown provider: ${provider}`);
    }
    return provider;
  }

  static pickInboundProvider(provider) {
    if (provider !== "telnyx" && provider !== "sinch") {
      throw new ProviderError(`Unknown provider: ${provider}`);
    }
    return provider;
  }
}

module.exports = ProviderRouter;
