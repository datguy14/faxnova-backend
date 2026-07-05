// src/controllers/outboundFaxController.js

const idempotencyGuard = require("../guards/idempotencyGuard");
const residencyGuard = require("../guards/residencyGuard");

const FaxEventService = require("../services/FaxEventService");

const telnyxAdapter = require("../providers/telnyxAdapter");
const sinchAdapter = require("../providers/sinchAdapter");

const ProviderError = require("../errors/ProviderError");
const FaxError = require("../errors/FaxError");

/**
 * Outbound Fax Controller — Strict‑Mode Edition
 *
 * Handles outbound fax sending using provider adapters.
 * Guards: idempotency + residency
 * Provider: Telnyx or Sinch (explicit selection)
 */

exports.sendFax = async (req, res, next) => {
  try {
    const { to, storageKey, region, provider } = req.body;

    // Guard: idempotency
    idempotencyGuard.ensureUnique(req);

    // Guard: residency
    residencyGuard.ensureOutboundRegion(region);

    // Provider selection
    let adapter;
    if (provider === "telnyx") adapter = telnyxAdapter;
    else if (provider === "sinch") adapter = sinchAdapter;
    else throw new ProviderError(`Unknown provider: ${provider}`);

    // Send fax
    const result = await adapter.sendFax({ to, storageKey, region });

    if (!result.ok) {
      throw new FaxError(result.error);
    }

    // Persist fax event
    await FaxEventService.recordOutbound({
      provider,
      providerFaxId: result.providerFaxId,
      to,
      storageKey,
      region
    });

    return res.status(200).json({
      ok: true,
      provider,
      providerFaxId: result.providerFaxId
    });
  } catch (err) {
    next(err);
  }
};
