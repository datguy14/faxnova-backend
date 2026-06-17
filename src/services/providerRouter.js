// src/services/providerRouter.js
import { providerPerformanceService } from "./providerPerformanceService.js";
import { providerOutageService } from "./providerOutageService.js";
import { providerRoutingRules } from "./providerRoutingRules.js";
import { residencyEngine } from "../residency/residencyEngine.js";
import { getTierFromApiKey } from "../middleware/getTierFromApiKey.js";

export const providerRouter = {
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

    // 4. Apply API key tier rules (Basic, Pro, Enterprise)
    const tier = getTierFromApiKey(apiKey);
    providers = providerRoutingRules.applyTierRules(providers, tier);

    // 5. Fetch provider performance scores
    const performance = await providerPerformanceService.getPerformanceScores();

    // 6. Score providers (latency, success rate, cost, residency match)
    const scored = providers.map((provider) => {
      const perf = performance[provider.name] || {
        latency: 500,
        successRate: 0.90,
        cost: 1.0
      };

      const score =
        provider.weight * 0.4 +
        perf.successRate * 0.3 +
        (1 / perf.latency) * 0.2 +
        (1 / perf.cost) * 0.1;

      return {
        name: provider.name,
        score,
        metadata: provider
      };
    });

    // 7. Sort by score (highest wins)
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
