// src/services/routingService.v2.js

const providerRouter = require("../providers/providerRouter");
const providerPerformance = require("./providerPerformanceService");
const providerOutages = require("./providerOutageService");
const FaxNovaError = require("../errors/FaxNovaError");

async function routeFax({ region, retry }) {
  try {
    const scores = await providerPerformance.getScores();
    const outages = await providerOutages.getOutageStates();

    const residencyZone = region === "eu" ? "eu" : "us";

    const provider = providerRouter.selectProvider({
      residencyZone,
      sovereignty: region,
      scores,
      outages,
      retry
    });

    const adapter = providerRouter.getAdapter(provider);

    return { provider, adapter };

  } catch (err) {
    throw new FaxNovaError("RoutingEngine v2 failed", {
      code: "ROUTING_ENGINE_FAILED",
      details: err.message
    });
  }
}

module.exports = { routeFax };
