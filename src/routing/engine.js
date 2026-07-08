// src/routing/engine.js
// FaxNova Routing Engine — Telnyx + Sinch (Strict‑Mode)

const { telnyx, sinch } = require("../providers");

// Provider registry for routing
const providers = [
  {
    name: "telnyx",
    client: telnyx
  },
  {
    name: "sinch",
    client: sinch
  }
];

/**
 * Collect diagnostics from all providers
 * Shape:
 *  {
 *    provider: 'telnyx' | 'sinch',
 *    healthy: boolean,
 *    latencyMs: number,
 *    httpStatus: number | null,
 *    score: number,
 *    raw: any
 *  }
 */
async function getProviderDiagnostics() {
  const results = [];

  for (const provider of providers) {
    try {
      const diag = await provider.client.getDiagnostics();

      results.push({
        provider: provider.name,
        ...diag
      });
    } catch (err) {
      // Hard failure becomes a low score, unhealthy provider
      results.push({
        provider: provider.name,
        healthy: false,
        latencyMs: Infinity,
        httpStatus: null,
        score: -10,
        raw: { error: err.message }
      });
    }
  }

  return results;
}

/**
 * Select the best provider based on diagnostics score.
 * Highest score wins. Unhealthy providers are deprioritized.
 */
async function selectBestProvider() {
  const diagnostics = await getProviderDiagnostics();

  // Log diagnostics for observability
  console.log("📊 Provider diagnostics:", diagnostics);

  // Filter out completely dead providers (optional)
  const viable = diagnostics.filter((d) => d.healthy && d.score > -5);

  const candidates = viable.length > 0 ? viable : diagnostics;

  const sorted = candidates.sort((a, b) => b.score - a.score);

  const best = sorted[0];

  console.log(`🎯 Selected provider: ${best.provider} (score=${best.score})`);

  const providerEntry = providers.find((p) => p.name === best.provider);

  return {
    diagnostics,
    selected: best,
    client: providerEntry.client
  };
}

/**
 * Route an outbound fax through the best provider.
 *
 * @param {Object} payload
 * @param {string} payload.to
 * @param {string} payload.from
 * @param {string} payload.mediaUrl
 * @param {string} [payload.correlationId]
 */
async function routeFax(payload) {
  const { client, selected } = await selectBestProvider();

  console.log(
    `📨 Routing fax via ${selected.provider} -> to=${payload.to}, from=${payload.from}`
  );

  const result = await client.sendFax(payload);

  return {
    provider: selected.provider,
    result
  };
}

/**
 * Simple outage check for monitoring / dashboards.
 */
async function checkOutages() {
  const diagnostics = await getProviderDiagnostics();

  const outages = diagnostics.filter((d) => !d.healthy);

  outages.forEach((o) => {
    console.log(`⚠️ Provider outage detected: ${o.provider}`);
  });

  return outages;
}

module.exports = {
  getProviderDiagnostics,
  selectBestProvider,
  routeFax,
  checkOutages
};
