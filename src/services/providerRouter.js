const providerPerformanceService = require("./providerPerformanceService");
const providerOutageService = require("./providerOutageService");
const providerRoutingRules = require("./providerRoutingRules");
const residencyEngine = require("../residency/residencyEngine");
const getTierFromApiKey = require("../middleware/getTierFromApiKey");

const providerRouter = {
  /**
   * Select the best provider for an outbound fax.
   * Uses residency, outages, performance scoring, and tier rules.
   */
  async routeFax({ toNumber, tenantId, apiKey }) {
    // 1. Determine residency zone
    const residency = residencyEngine.resolveOutbound({ toNumber });

    // 2. Get provider list for this residency zone
    let providers = providerRoutingRules.getProvidersForZone(residency.zone);

    if (!providers || providers.length === 0) {
      throw new Error(`No providers available for zone: ${residency.zone}`);
    }

    // 3. Remove providers currently in outage
    const outages = await providerOutageService.getActiveOutages();
    providers = providers.filter((p) => !outages.includes(p.name));

    if (providers.length === 0) {
      throw new Error("All providers are currently in outage");
    }

    // 4. Apply API key tier rules
    const tier = getTierFromApiKey(apiKey);
    providers = providerRoutingRules.applyTierRules(providers, tier);

    if (providers.length === 0) {
      throw new Error(`No providers available for tier: ${tier}`);
    }

    // 5. Fetch provider performance summary
    const performance = await providerPerformanceService.getPerformanceSummary();

    // 6. Score providers
    const scored = providers.map((provider) => {
      const perf = performance[provider.name] || {
        avgLatencyMs: 500,
        successRate: 0.90,
        costScore: 1.0
      };

      const latencyScore =
        perf.avgLatencyMs <= 200 ? 1.0 :
        perf.avgLatencyMs <= 800 ? 0.5 : 0.2;

      const successScore = perf.successRate ?? 0.9;
      const costScore = perf.costScore ?? 1.0;

      const score =
        provider.weight * 0.4 +
        successScore * 0.3 +
        latencyScore * 0.2 +
        costScore * 0.1;

      return {
        name: provider.name,
        score,
        metadata: provider
      };
    });

    // 7. Sort by score
    scored.sort((a, b) => b.score - a.score);

    // 8. Select the top provider
    const selected = scored[0];

    return {
      provider: selected.name,
      residencyZone: residency.zone,
      sovereignty: residency.sovereignty,
      providerMetadata: selected.metadata
    };
  },

  /**
   * Returns real-time provider status for dashboard.
   */
  async getProviderStatus() {
    const outages = await providerOutageService.getActiveOutages();
    const performance = await providerPerformanceService.getPerformanceSummary();
    const routing = providerRoutingRules.getAllProviders();

    return {
      outages,
      performance,
      routing
    };
  }
};

module.exports = providerRouter;
