// src/services/providerOutageService.js — Fully Updated, Production‑Ready (CommonJS Only)

/**
 * Provider outage map:
 * Tracks health per provider *per region*.
 *
 * Structure:
 * {
 *   telnyx: {
 *     us: { status: "UP", lastUpdated: Date },
 *     eu: { status: "DEGRADED", lastUpdated: Date }
 *   },
 *   sinch: {
 *     us: { status: "UP", lastUpdated: Date },
 *     eu: { status: "UP", lastUpdated: Date }
 *   }
 * }
 *
 * This supports:
 * - multi‑region routing
 * - failover logic
 * - SLA scoring
 * - outage scoring
 */

const providerHealth = {
  telnyx: {
    us: { status: "UP", lastUpdated: new Date() },
    eu: { status: "UP", lastUpdated: new Date() }
  },
  sinch: {
    us: { status: "UP", lastUpdated: new Date() },
    eu: { status: "UP", lastUpdated: new Date() }
  }
};

/**
 * Get provider health for a specific region.
 * Falls back to "UNKNOWN" if provider or region is missing.
 */
exports.getProviderHealth = async (provider, region = "us") => {
  const providerEntry = providerHealth[provider];

  if (!providerEntry) {
    return { status: "UNKNOWN", region, lastUpdated: null };
  }

  const regionEntry = providerEntry[region];

  if (!regionEntry) {
    return { status: "UNKNOWN", region, lastUpdated: null };
  }

  return {
    status: regionEntry.status,
    region,
    lastUpdated: regionEntry.lastUpdated
  };
};

/**
 * Set provider health for ops tools or automated monitors.
 * Example:
 *   setProviderHealth("telnyx", "eu", "DOWN")
 */
exports.setProviderHealth = async (provider, region = "us", status) => {
  if (!providerHealth[provider]) {
    providerHealth[provider] = {};
  }

  providerHealth[provider][region] = {
    status,
    lastUpdated: new Date()
  };

  return providerHealth[provider][region];
};

/**
 * Get outage scores for all providers in a region.
 * Used by routingService.v2 to bias routing away from degraded/down providers.
 */
exports.getProviderScores = async (region = "us") => {
  const scores = {};

  for (const provider of Object.keys(providerHealth)) {
    const health = await exports.getProviderHealth(provider, region);

    let score = 0;

    if (health.status === "DOWN") score = 5;
    if (health.status === "DEGRADED") score = 2;
    if (health.status === "UP") score = 0;

    scores[provider] = score;
  }

  return scores;
};
