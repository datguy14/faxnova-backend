// src/providers/providerRouter.js

/**
 * Provider Router (FaxNova v1)
 *
 * Responsibilities:
 * - Select best provider using:
 *   - residency zone
 *   - sovereignty
 *   - outage states
 *   - real performance scores (0–100)
 *   - retry-aware failover logic
 */

const FaxNovaError = require("../errors/FaxNovaError");
const sinchAdapter = require("./sinchAdapter");
const telnyxAdapter = require("./telnyxAdapter");

/**
 * Provider adapters
 */
const adapters = {
  sinch: sinchAdapter,
  telnyx: telnyxAdapter
};

/**
 * Residency → provider preference map
 */
const residencyPreference = {
  us: ["sinch", "telnyx"],
  eu: ["telnyx", "sinch"],
  global: ["telnyx", "sinch"]
};

/**
 * Select provider using:
 * - residency zone
 * - sovereignty
 * - outage states
 * - real performance scores
 * - retry-aware failover
 */
function selectProvider({ residencyZone, sovereignty, scores, outages, retry }) {
  if (!residencyZone || !scores || !outages) {
    throw new FaxNovaError("ProviderRouter missing routing fields", {
      code: "PROVIDER_ROUTER_FIELDS_MISSING"
    });
  }

  // 1. Residency-based provider order
  const preferred = residencyPreference[residencyZone] || residencyPreference.global;

  // 2. Filter out providers in OPEN outage state
  const available = preferred.filter((provider) => {
    const state = outages[provider]?.state || "closed";
    return state !== "open";
  });

  if (available.length === 0) {
    throw new FaxNovaError("No providers available (all in outage)", {
      code: "NO_PROVIDERS_AVAILABLE",
      residencyZone,
      sovereignty
    });
  }

  // 3. Retry → force failover to next provider
  if (retry && available.length > 1) {
    return available[1];
  }

  // 4. Score-based selection (highest score wins)
  let bestProvider = available[0];
  let bestScore = scores[bestProvider] || 0;

  for (const provider of available) {
    const score = scores[provider] || 0;
    if (score > bestScore) {
      bestProvider = provider;
      bestScore = score;
    }
  }

  return bestProvider;
}

/**
 * Return provider adapter
 */
function getAdapter(provider) {
  const adapter = adapters[provider];
  if (!adapter) {
    throw new FaxNovaError("Unknown provider adapter", {
      code: "PROVIDER_ADAPTER_UNKNOWN",
      provider
    });
  }
  return adapter;
}

module.exports = {
  selectProvider,
  getAdapter
};
