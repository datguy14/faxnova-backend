// src/services/providerOutageService.js

// Simple in‑memory health map for now.
// Later you can back this with MongoDB or Redis.
const providerHealth = {
  telnyx: { status: "UP" },
  sinch: { status: "UP" }
};

exports.getProviderHealth = async provider => {
  const health = providerHealth[provider];

  if (!health) {
    return { status: "UNKNOWN" };
  }

  return health;
};

// Optional: let you set health manually (for ops tools)
exports.setProviderHealth = async (provider, status) => {
  providerHealth[provider] = { status };
  return providerHealth[provider];
};
