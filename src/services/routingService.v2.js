// src/services/routingService.v2.js

const providerRouter = require("./providerRouter.v2");

exports.selectProvider = async ({ residencyZone, tier, region }) => {
  const provider = await providerRouter.routeProvider({ provider: tier, region });
  return { primary: provider.provider };
};
