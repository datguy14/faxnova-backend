const slaScoringService = require("./slaScoringService");
const auditService = require("./auditService");

module.exports = {
  async evaluateProviders() {
    const telnyx = await slaScoringService.scoreProvider("telnyx");
    const sinch = await slaScoringService.scoreProvider("sinch");

    const providers = [telnyx, sinch];

    for (const p of providers) {
      const violated = !p.sla.successRateOk || !p.sla.errorRateOk || !p.sla.latencyOk;

      if (violated) {
        await auditService.logEvent({
          type: "SLA_VIOLATION",
          details: {
            provider: p.provider,
            successRate: p.successRate,
            errorRate: p.errorRate,
            avgLatency: p.avgLatency,
            sla: p.sla
          }
        });
      }
    }

    return { telnyx, sinch };
  }
};
