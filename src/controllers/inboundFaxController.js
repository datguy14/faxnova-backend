// src/controllers/inboundFaxController.js

const residencyGuard = require("../guards/residencyGuard");
const webhookQueue = require("../queues/webhookQueue");

const telnyxInboundAdapter = require("../providers/telnyxInboundAdapter");
const sinchInboundAdapter = require("../providers/sinchInboundAdapter");

const ProviderError = require("../errors/ProviderError");
const WebhookError = require("../errors/WebhookError");

/**
 * Inbound Fax Controller — Strict‑Mode Edition
 *
 * Handles inbound fax webhooks from providers.
 * Normalizes payloads → validates residency → enqueues for worker processing.
 */

exports.receiveFax = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const payload = req.body;

    // Provider selection
    let adapter;
    if (provider === "telnyx") adapter = telnyxInboundAdapter;
    else if (provider === "sinch") adapter = sinchInboundAdapter;
    else throw new ProviderError(`Unknown provider: ${provider}`);

    // Normalize inbound fax payload
    const normalized = adapter.normalizeInboundFax(payload);

    if (!normalized.ok) {
      throw new WebhookError(normalized.error);
    }

    const { region } = normalized;

    // Guard: residency
    residencyGuard.ensureInboundRegion(region);

    // Enqueue for worker processing
    await webhookQueue.addInboundFax(normalized);

    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
};
