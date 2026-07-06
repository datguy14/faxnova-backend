// src/services/retryFaxService.js

const ProviderRouter = require("./providerRouter.v2");
const telnyxAdapter = require("../providers/telnyxAdapter");
const sinchAdapter = require("../providers/sinchAdapter");

const FaxEventService = require("./FaxEventService");
const OutboundFax = require("../models/OutboundFax");

class RetryFaxService {
  static async retry({ faxId }) {
    const fax = await OutboundFax.findById(faxId);
    if (!fax) throw new Error("Outbound fax not found");

    const provider = ProviderRouter.pickOutboundProvider(fax.provider);

    const adapter =
      provider === "telnyx" ? telnyxAdapter : sinchAdapter;

    const result = await adapter.sendFax({
      to: fax.to,
      storageKey: fax.storageKey,
      region: fax.region
    });

    if (!result.ok) {
      throw new Error(`Retry failed: ${result.error}`);
    }

    fax.providerFaxId = result.providerFaxId;
    await fax.save();

    await FaxEventService.recordOutbound({
      provider,
      providerFaxId: result.providerFaxId,
      to: fax.to,
      storageKey: fax.storageKey,
      region: fax.region
    });

    return { ok: true, providerFaxId: result.providerFaxId };
  }
}

module.exports = RetryFaxService;
