const routingServiceV2 = require("./routingService.v2");
const sinchAdapter = require("../providers/sinchAdapter");
const telnyxAdapter = require("../providers/telnyxAdapter");
const providerPerformanceService = require("./providerPerformanceService");

const sendFaxService = {
  async sendFax(payload) {
    const { residencyZone, tier, to, from, pages, documentUrl } = payload;

    // 1. Ask routing engine for primary + failover
    const { primary, failover } = await routingServiceV2.selectProvider({
      residencyZone,
      tier
    });

    // Helper to pick adapter
    const getAdapter = (provider) =>
      provider === "sinch" ? sinchAdapter : telnyxAdapter;

    // 2. Try primary provider
    const startPrimary = Date.now();
    try {
      const adapter = getAdapter(primary.provider);
      const result = await adapter.sendFax({ to, from, pages, documentUrl });

      const latencyMs = Date.now() - startPrimary;
      await providerPerformanceService.recordLatency(primary.provider, latencyMs);
      await providerPerformanceService.recordSuccess(primary.provider);

      return {
        provider: primary.provider,
        failoverProvider: failover?.provider ?? null,
        routingScore: primary.score,
        jobId: result.jobId,
        latencyMs
      };
    } catch (err) {
      await providerPerformanceService.recordFailure(primary.provider);

      // 3. If no failover, bubble error
      if (!failover) {
        throw new Error("All providers unavailable");
      }

      // 4. Try failover provider
      const startFailover = Date.now();
      try {
        const adapter = getAdapter(failover.provider);
        const result = await adapter.sendFax({ to, from, pages, documentUrl });

        const latencyMs = Date.now() - startFailover;
        await providerPerformanceService.recordLatency(
          failover.provider,
          latencyMs
        );
        await providerPerformanceService.recordSuccess(failover.provider);

        return {
          provider: failover.provider,
          failoverFrom: primary.provider,
          routingScore: failover.score,
          jobId: result.jobId,
          latencyMs
        };
      } catch (err2) {
        await providerPerformanceService.recordFailure(failover.provider);
        throw new Error("Primary and failover providers failed");
      }
    }
  }
};

module.exports = sendFaxService;
