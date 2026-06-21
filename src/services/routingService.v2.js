const providerHealthService = require("./providerHealthService");
const providerBillingService = require("./providerBillingService");

const PROVIDERS = ["sinch", "telnyx"];

const WEIGHTS = {
  latency: 0.25,
  success: 0.30,
  cost: 0.20,
  residency: 0.15,
  outage: 0.10
};

const routingServiceV2 = {
  async selectProvider({ residencyZone, tier }) {
    const health = await providerHealthService.getCurrentHealth();
    const billing = await providerBillingService.getRates({ tier });

    const scored = PROVIDERS.map((provider) => {
      const h = health[provider];
      const b = billing.providers.find((p) => p.provider === provider);

      const latencyScore = normalizeLatency(h?.avgLatencyMs);
      const successScore = h?.successRate ?? 0;
      const costScore = normalizeCost(b?.ratePerPage);
      const residencyScore = b?.zones?.some((z) => z.zone === residencyZone) ? 1 : 0;
      const outageScore = h?.activeOutage ? 0 : 1;

      const score =
        WEIGHTS.latency * latencyScore +
        WEIGHTS.success * successScore +
        WEIGHTS.cost * costScore +
        WEIGHTS.residency * residencyScore +
        WEIGHTS.outage * outageScore;

      return {
        provider,
        score,
        metrics: {
          latencyScore,
          successScore,
          costScore,
          residencyScore,
          outageScore
        }
      };
    });

    scored.sort((a, b) => b.score - a.score);

    const primary = scored[0];
    const failover = scored[1];

    return { primary, failover, scored };
  }
};

function normalizeLatency(ms) {
  if (!ms) return 0.5;
  if (ms <= 200) return 1.0;
  if (ms <= 800) return 0.5;
  return 0.2;
}

function normalizeCost(ratePerPage) {
  if (!ratePerPage) return 0.5;
  if (ratePerPage <= 0.03) return 1.0;
  if (ratePerPage <= 0.06) return 0.6;
  return 0.3;
}

module.exports = routingServiceV2;
