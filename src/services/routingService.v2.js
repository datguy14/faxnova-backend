// src/services/routingService.v2.js
//
// Strict‑Mode Stub:
// Routing engine removed. Providers are chosen explicitly by controllers.

exports.pickProvider = (provider) => {
  if (provider !== "telnyx" && provider !== "sinch") {
    throw new Error(`Unknown provider: ${provider}`);
  }
  return provider;
};
